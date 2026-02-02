import express from "express";
import cors from "cors";
import multer from "multer";
import ExcelJS from "exceljs";
import dotenv from "dotenv";
import crypto from "crypto";
import { Readable } from "node:stream";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { pool, query } from "./db.js";
import { encryptIin } from "./encryption.js";
import { sendEmail } from "./email.js";
import { generateCertificatePdf } from "./pdf.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.AUTH_JWT_SECRET;
const trainingCenterName = process.env.TRAINING_CENTER_NAME || "WinterGreen Academia";
const defaultQualification = process.env.CERTIFICATE_QUALIFICATION || "Кальянный мастер";

if (!jwtSecret) {
  throw new Error("AUTH_JWT_SECRET is required");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", 1);
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

function authenticate(req, _res, next) {
  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = req.cookies?.auth_token;
  const token = bearerToken || cookieToken;

  if (token) {
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch (_error) {
      req.user = null;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, token) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

app.use(authenticate);

function getActor(req) {
  return req.user?.email || req.get("x-actor") || process.env.DEFAULT_ACTOR || "system";
}

function getActorRole(req) {
  return req.user?.role || req.get("x-actor-role") || "admin";
}

async function auditLog(req, { action, entityType, entityId, metadata }) {
  await query(
    "INSERT INTO audit_logs (actor, actor_role, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
    [getActor(req), getActorRole(req), action, entityType, entityId, metadata || null]
  );
}

async function recordEmployeeTransfer(executor, { employeeId, fromEstablishmentId, toEstablishmentId, reason, actor }) {
  const run = executor?.query ? executor : { query };
  await run.query(
    `INSERT INTO employee_transfers (employee_id, from_establishment_id, to_establishment_id, reason, actor)
     VALUES ($1, $2, $3, $4, $5)`,
    [employeeId, fromEstablishmentId || null, toEstablishmentId || null, reason || null, actor || null]
  );
}

function createRegistrationToken() {
  return crypto.randomBytes(24).toString("hex");
}

function createCertificateNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomInt(1000, 9999);
  return `CERT-${datePart}-${rand}`;
}

function stripEmployee(row) {
  if (!row) return row;
  const { iin_encrypted, ...rest } = row;
  return rest;
}

function parseTrainingStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) {
    return "pending";
  }
  if (["passed", "pass", "ok", "true", "1", "yes", "сдал", "успех"].some((key) => value.includes(key))) {
    return "passed";
  }
  if (["failed", "fail", "false", "0", "no", "не сдал", "ошибка"].some((key) => value.includes(key))) {
    return "failed";
  }
  return "pending";
}

function normalizeHeaderKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function pickRowValue(row, keys) {
  for (const key of keys) {
    if (row[key] === undefined || row[key] === null) {
      continue;
    }
    const text = String(row[key]).trim();
    if (text !== "") {
      return row[key];
    }
  }
  return null;
}

async function parseSpreadsheetRows(file) {
  const workbook = new ExcelJS.Workbook();
  const filename = String(file.originalname || "").toLowerCase();

  if (filename.endsWith(".csv")) {
    await workbook.csv.read(Readable.from(file.buffer));
  } else if (filename.endsWith(".xlsx")) {
    await workbook.xlsx.load(file.buffer);
  } else {
    throw new Error("Unsupported file type");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const value = cell.text || cell.value;
    headers[colNumber - 1] = value ? String(value).trim() : "";
  });

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const record = {};
    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      const cell = row.getCell(index + 1);
      const cellValue = cell?.text ?? cell?.value;
      record[header] = cellValue ?? "";
    });
    rows.push(record);
  });

  return rows;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/bootstrap", authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    key: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  if (!process.env.ADMIN_BOOTSTRAP_KEY) {
    return res.status(500).json({ error: "ADMIN_BOOTSTRAP_KEY is not configured" });
  }

  if (parsed.data.key !== process.env.ADMIN_BOOTSTRAP_KEY) {
    return res.status(403).json({ error: "Invalid bootstrap key" });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows.length) {
      return res.status(409).json({ error: "Admin already exists" });
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    const result = await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin') RETURNING id, email, role",
      [parsed.data.email.toLowerCase(), hash]
    );

    const token = signToken(result.rows[0]);
    setAuthCookie(res, token);
    res.status(201).json({ role: result.rows[0].role });
  } catch (error) {
    res.status(500).json({ error: "Failed to bootstrap admin" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `SELECT users.id, users.email, users.role, users.password_hash, users.employee_id,
              employees.deleted_at AS employee_deleted
       FROM users
       LEFT JOIN employees ON employees.id = users.employee_id
       WHERE users.email = $1`,
      [parsed.data.email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role === "employee" && (!user.employee_id || user.employee_deleted)) {
      return res.status(403).json({ error: "Employee is inactive" });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/api/auth/logout", requireAuth, async (_req, res) => {
  res.clearCookie("auth_token", {
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
  });
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.json({ user: req.user });
    }

    const userResult = await query(
      `SELECT users.id, users.email, users.role, employees.id AS employee_id, employees.full_name,
              employees.city, employees.phone, employees.iin_last4, employees.status, employees.establishment_id,
              employees.deleted_at AS employee_deleted,
              establishments.name AS establishment_name,
              establishments.deleted_at AS establishment_deleted
       FROM users
       LEFT JOIN employees ON employees.id = users.employee_id
       LEFT JOIN establishments ON establishments.id = employees.establishment_id
       WHERE users.id = $1`,
      [req.user.sub]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.employee_id || user.employee_deleted) {
      return res.status(403).json({ error: "Employee is inactive" });
    }

    const certificates = await query(
      `SELECT id, certificate_number, status, issued_at, valid_until
       FROM certificates
       WHERE employee_id = $1
       ORDER BY issued_at DESC`,
      [user.employee_id]
    );

    res.json({
      user,
      certificates: certificates.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

app.get("/api/metrics", requireAdmin, async (_req, res) => {
  try {
    const [establishments, employees, certificates] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM establishments WHERE deleted_at IS NULL"),
      query("SELECT COUNT(*)::int AS count FROM employees WHERE deleted_at IS NULL"),
      query("SELECT COUNT(*)::int AS count FROM certificates WHERE status = 'active'"),
    ]);

    const employeeStatuses = await query(
      "SELECT status, COUNT(*)::int AS count FROM employees WHERE deleted_at IS NULL GROUP BY status"
    );

    res.json({
      establishments: establishments.rows[0].count,
      employees: employees.rows[0].count,
      activeCertificates: certificates.rows[0].count,
      employeeStatuses: employeeStatuses.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load metrics" });
  }
});

app.get("/api/establishments", requireAdmin, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const whereClause = includeArchived ? "" : "WHERE e.deleted_at IS NULL";
    const result = await query(
      `SELECT e.*, 
        COUNT(DISTINCT em.id)::int AS employees_count,
        COUNT(DISTINCT c.id)::int AS certificates_count
      FROM establishments e
      LEFT JOIN employees em ON em.establishment_id = e.id AND em.deleted_at IS NULL
      LEFT JOIN certificates c ON c.establishment_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load establishments" });
  }
});

app.post("/api/establishments", requireAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    representative: z.string().optional().nullable(),
    representativePhone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `INSERT INTO establishments (name, city, representative, representative_phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        parsed.data.name,
        parsed.data.city,
        parsed.data.representative || null,
        parsed.data.representativePhone || null,
        parsed.data.address || null,
      ]
    );
    await auditLog(req, {
      action: "establishments.create",
      entityType: "establishment",
      entityId: result.rows[0].id,
      metadata: { name: parsed.data.name },
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create establishment" });
  }
});

app.put("/api/establishments/:id", requireAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    representative: z.string().optional().nullable(),
    representativePhone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `UPDATE establishments
       SET name = COALESCE($1, name),
           city = COALESCE($2, city),
           representative = COALESCE($3, representative),
           representative_phone = COALESCE($4, representative_phone),
           address = COALESCE($5, address),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        parsed.data.name ?? null,
        parsed.data.city ?? null,
        parsed.data.representative ?? null,
        parsed.data.representativePhone ?? null,
        parsed.data.address ?? null,
        req.params.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Establishment not found" });
    }

    await auditLog(req, {
      action: "establishments.update",
      entityType: "establishment",
      entityId: req.params.id,
      metadata: parsed.data,
    });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update establishment" });
  }
});

app.delete("/api/establishments/:id", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE establishments
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name`,
      [req.params.id]
    );
    if (!result.rows.length) {
      const existing = await query("SELECT id, deleted_at FROM establishments WHERE id = $1", [req.params.id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      return res.status(409).json({ error: "Establishment already archived" });
    }

    await auditLog(req, {
      action: "establishments.archive",
      entityType: "establishment",
      entityId: req.params.id,
      metadata: { name: result.rows[0].name },
    });

    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "Failed to archive establishment" });
  }
});

app.post("/api/establishments/:id/restore", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE establishments
       SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, name`,
      [req.params.id]
    );
    if (!result.rows.length) {
      const existing = await query("SELECT id FROM establishments WHERE id = $1", [req.params.id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: "Establishment not found" });
      }
      return res.status(409).json({ error: "Establishment already active" });
    }

    await auditLog(req, {
      action: "establishments.restore",
      entityType: "establishment",
      entityId: req.params.id,
      metadata: { name: result.rows[0].name },
    });

    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "Failed to restore establishment" });
  }
});

app.get("/api/employees", requireAdmin, async (req, res) => {
  const { establishmentId, status, search } = req.query;
  const includeArchived = req.query.includeArchived === "true";
  const params = [];
  const conditions = [];

  if (!includeArchived) {
    conditions.push("employees.deleted_at IS NULL");
  }

  if (establishmentId) {
    params.push(establishmentId);
    conditions.push(`employees.establishment_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`employees.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(employees.full_name ILIKE $${params.length} OR employees.email ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query(
      `SELECT employees.id, employees.establishment_id, employees.full_name, employees.email, employees.city,
              employees.phone, employees.iin_last4, employees.status, employees.registration_token,
              employees.registered_at, employees.created_at, employees.updated_at, employees.deleted_at,
              establishments.name AS establishment_name,
              establishments.address AS establishment_address,
              establishments.deleted_at AS establishment_deleted_at
       FROM employees
       LEFT JOIN establishments ON establishments.id = employees.establishment_id
       ${whereClause}
       ORDER BY employees.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load employees" });
  }
});

app.post("/api/employees", requireAdmin, async (req, res) => {
  const schema = z.object({
    establishmentId: z.string().uuid(),
    fullName: z.string().min(2),
    email: z.string().email(),
    city: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  const token = createRegistrationToken();

  try {
    const establishment = await query(
      "SELECT id FROM establishments WHERE id = $1 AND deleted_at IS NULL",
      [parsed.data.establishmentId]
    );
    if (!establishment.rows.length) {
      return res.status(409).json({ error: "Establishment is archived" });
    }

    const result = await query(
      `INSERT INTO employees (establishment_id, full_name, email, city, phone, status, registration_token)
       VALUES ($1, $2, $3, $4, $5, 'pending_registration', $6)
       RETURNING *`,
      [
        parsed.data.establishmentId,
        parsed.data.fullName,
        parsed.data.email.toLowerCase(),
        parsed.data.city || null,
        parsed.data.phone || null,
        token,
      ]
    );

    await auditLog(req, {
      action: "employees.create",
      entityType: "employee",
      entityId: result.rows[0].id,
      metadata: { email: parsed.data.email },
    });

    await recordEmployeeTransfer(null, {
      employeeId: result.rows[0].id,
      fromEstablishmentId: null,
      toEstablishmentId: parsed.data.establishmentId,
      reason: "create",
      actor: getActor(req),
    });

    res.status(201).json({
      ...stripEmployee(result.rows[0]),
      registration_link: `/register/${token}`,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Employee email already exists" });
    }
    res.status(500).json({ error: "Failed to create employee" });
  }
});

app.post("/api/employees/bulk", requireAdmin, async (req, res) => {
  const schema = z.object({
    employees: z.array(
      z.object({
        establishmentId: z.string().uuid(),
        fullName: z.string().min(2),
        email: z.string().email(),
        city: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
      })
    ),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = [];
    const establishmentIds = [
      ...new Set(parsed.data.employees.map((employee) => employee.establishmentId)),
    ];
    const activeEstablishments = await client.query(
      "SELECT id FROM establishments WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL",
      [establishmentIds]
    );
    const activeSet = new Set(activeEstablishments.rows.map((row) => row.id));
    const missing = establishmentIds.filter((id) => !activeSet.has(id));
    if (missing.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Establishment is archived", missing });
    }

    for (const employee of parsed.data.employees) {
      const token = createRegistrationToken();
      const result = await client.query(
        `INSERT INTO employees (establishment_id, full_name, email, city, phone, status, registration_token)
         VALUES ($1, $2, $3, $4, $5, 'pending_registration', $6)
         RETURNING *`,
        [
          employee.establishmentId,
          employee.fullName,
          employee.email.toLowerCase(),
          employee.city || null,
          employee.phone || null,
          token,
        ]
      );
      created.push({
        ...stripEmployee(result.rows[0]),
        registration_link: `/register/${token}`,
      });
      await recordEmployeeTransfer(client, {
        employeeId: result.rows[0].id,
        fromEstablishmentId: null,
        toEstablishmentId: employee.establishmentId,
        reason: "bulk_create",
        actor: getActor(req),
      });
    }

    await client.query("COMMIT");
    await auditLog(req, {
      action: "employees.bulk_create",
      entityType: "employee",
      entityId: null,
      metadata: { count: created.length },
    });

    res.status(201).json({ created });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ error: "Duplicate email in batch" });
    }
    res.status(500).json({ error: "Failed to create employees" });
  } finally {
    client.release();
  }
});

app.put("/api/employees/:id", requireAdmin, async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2).optional(),
    city: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    status: z.enum([
      "pending_registration",
      "reset_password",
      "registered",
      "training_pending",
      "training_passed",
      "training_failed",
      "certified",
      "inactive",
    ]).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const current = await query(
      "SELECT status, registration_token, deleted_at FROM employees WHERE id = $1",
      [req.params.id]
    );
    if (!current.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (current.rows[0].deleted_at) {
      return res.status(409).json({ error: "Employee is archived" });
    }

    const shouldResetToken =
      parsed.data.status === "reset_password" &&
      (current.rows[0].status !== "reset_password" || !current.rows[0].registration_token);
    const resetToken = shouldResetToken ? createRegistrationToken() : null;
    const result = await query(
      `UPDATE employees
       SET full_name = COALESCE($1, full_name),
           city = COALESCE($2, city),
           phone = COALESCE($3, phone),
           status = COALESCE($4, status),
           registration_token = COALESCE($6, registration_token),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        parsed.data.fullName ?? null,
        parsed.data.city ?? null,
        parsed.data.phone ?? null,
        parsed.data.status ?? null,
        req.params.id,
        resetToken,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await auditLog(req, {
      action: "employees.update",
      entityType: "employee",
      entityId: req.params.id,
      metadata: parsed.data,
    });

    res.json(stripEmployee(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

app.delete("/api/employees/:id", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE employees
       SET deleted_at = NOW(), registration_token = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, full_name, email`,
      [req.params.id]
    );
    if (!result.rows.length) {
      const existing = await query("SELECT id, deleted_at FROM employees WHERE id = $1", [req.params.id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: "Employee not found" });
      }
      return res.status(409).json({ error: "Employee already archived" });
    }

    await auditLog(req, {
      action: "employees.archive",
      entityType: "employee",
      entityId: req.params.id,
      metadata: { email: result.rows[0].email },
    });

    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "Failed to archive employee" });
  }
});

app.post("/api/employees/:id/restore", requireAdmin, async (req, res) => {
  const schema = z.object({
    establishmentId: z.string().uuid().optional(),
  });

  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      "SELECT id, email, establishment_id, deleted_at FROM employees WHERE id = $1",
      [req.params.id]
    );
    if (!current.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = current.rows[0];
    if (!employee.deleted_at) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Employee already active" });
    }

    const targetEstablishmentId = parsed.data.establishmentId || employee.establishment_id;
    const targetEstablishment = await client.query(
      "SELECT id FROM establishments WHERE id = $1 AND deleted_at IS NULL",
      [targetEstablishmentId]
    );
    if (!targetEstablishment.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Establishment is archived" });
    }

    const result = await client.query(
      `UPDATE employees
       SET establishment_id = $2, deleted_at = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, targetEstablishmentId]
    );

    if (employee.establishment_id !== targetEstablishmentId) {
      await recordEmployeeTransfer(client, {
        employeeId: employee.id,
        fromEstablishmentId: employee.establishment_id,
        toEstablishmentId: targetEstablishmentId,
        reason: "restore",
        actor: getActor(req),
      });
    }

    await client.query("COMMIT");

    await auditLog(req, {
      action: "employees.restore",
      entityType: "employee",
      entityId: req.params.id,
      metadata: { email: employee.email },
    });

    res.json(stripEmployee(result.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to restore employee" });
  } finally {
    client.release();
  }
});

app.post("/api/employees/:id/transfer", requireAdmin, async (req, res) => {
  const schema = z.object({
    establishmentId: z.string().uuid(),
    reason: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      "SELECT id, email, establishment_id FROM employees WHERE id = $1",
      [req.params.id]
    );
    if (!current.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = current.rows[0];
    if (employee.establishment_id === parsed.data.establishmentId) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Employee already in establishment" });
    }

    const targetEstablishment = await client.query(
      "SELECT id FROM establishments WHERE id = $1 AND deleted_at IS NULL",
      [parsed.data.establishmentId]
    );
    if (!targetEstablishment.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Establishment is archived" });
    }

    const result = await client.query(
      `UPDATE employees
       SET establishment_id = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, parsed.data.establishmentId]
    );

    await recordEmployeeTransfer(client, {
      employeeId: employee.id,
      fromEstablishmentId: employee.establishment_id,
      toEstablishmentId: parsed.data.establishmentId,
      reason: parsed.data.reason,
      actor: getActor(req),
    });

    await client.query("COMMIT");

    await auditLog(req, {
      action: "employees.transfer",
      entityType: "employee",
      entityId: req.params.id,
      metadata: { toEstablishmentId: parsed.data.establishmentId },
    });

    res.json(stripEmployee(result.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to transfer employee" });
  } finally {
    client.release();
  }
});

app.post("/api/employees/:id/send-training", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE employees
       SET status = 'training_pending', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await auditLog(req, {
      action: "employees.send_training",
      entityType: "employee",
      entityId: req.params.id,
      metadata: { email: result.rows[0].email },
    });

    res.json({
      message: "Training invitation queued",
      trainingUrl: process.env.GETCOURSE_URL || "https://getcourse.example",
    });

    sendEmail({
      to: result.rows[0].email,
      subject: "Ссылка на обучение",
      text: `Здравствуйте, ${result.rows[0].full_name}. Ссылка на обучение: ${process.env.GETCOURSE_URL || "https://getcourse.example"
        }`,
    }).catch((error) => console.warn("Email send failed", error));
  } catch (error) {
    res.status(500).json({ error: "Failed to send training invite" });
  }
});

app.get("/api/registration/:token", async (req, res) => {
  try {
    const result = await query(
      `SELECT employees.id, employees.email, employees.full_name, employees.status,
              employees.city AS employee_city,
              employees.phone AS employee_phone,
              establishments.name AS establishment_name,
              establishments.city AS establishment_city,
              establishments.address AS establishment_address
       FROM employees
       JOIN establishments ON establishments.id = employees.establishment_id
       WHERE employees.registration_token = $1
         AND employees.deleted_at IS NULL
         AND establishments.deleted_at IS NULL`,
      [req.params.token]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Registration link not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registration data" });
  }
});

app.post("/api/registration/:token", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const employeeResult = await client.query(
      `SELECT employees.id, employees.email, employees.status, employees.full_name, employees.establishment_id
       FROM employees
       JOIN establishments ON establishments.id = employees.establishment_id
       WHERE employees.registration_token = $1
         AND employees.deleted_at IS NULL
         AND establishments.deleted_at IS NULL
       FOR UPDATE`,
      [req.params.token]
    );

    if (!employeeResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Registration link not found" });
    }

    const employee = employeeResult.rows[0];
    const schema = employee.status === "reset_password"
      ? z.object({
        fullName: z.string().optional(),
        city: z.string().optional(),
        phone: z.string().optional(),
        iin: z.string().optional().nullable(),
        password: z.string().min(8),
        acceptPolicy: z.literal(true),
        acceptOffer: z.literal(true),
        acceptAge: z.literal(true),
      })
      : z.object({
        fullName: z.string().min(2),
        city: z.string().min(2),
        phone: z.string().min(6),
        iin: z.string().optional().nullable(),
        password: z.string().min(8),
        acceptPolicy: z.literal(true),
        acceptOffer: z.literal(true),
        acceptAge: z.literal(true),
      });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
    }

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [employee.email]);
    if (existingUser.rows.length) {
      if (employee.status === "reset_password") {
        const passwordHash = await bcrypt.hash(parsed.data.password, 10);
        await client.query(
          "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
          [passwordHash, existingUser.rows[0].id]
        );
        await client.query(
          `UPDATE employees
           SET status = 'registered',
               registration_token = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [employee.id]
        );
        await client.query("COMMIT");
        await auditLog(req, {
          action: "employees.reset_password",
          entityType: "employee",
          entityId: employee.id,
          metadata: { email: employee.email },
        });
        return res.json({ message: "Password reset completed", employeeId: employee.id });
      }

      await client.query("ROLLBACK");
      return res.status(409).json({ error: "USER_EXISTS" });
    }

    const encrypted = encryptIin(parsed.data.iin || null);
    const result = await client.query(
      `UPDATE employees
       SET full_name = $1,
           city = $2,
           phone = $3,
           iin_encrypted = $4,
           iin_last4 = $5,
           status = 'registered',
           registered_at = NOW(),
           registration_token = NULL,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        parsed.data.fullName,
        parsed.data.city,
        parsed.data.phone,
        encrypted.encrypted,
        encrypted.last4,
        employee.id,
      ]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Registration link not found" });
    }

    const updatedEmployee = result.rows[0];
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await client.query(
      `INSERT INTO users (email, password_hash, role, employee_id)
       VALUES ($1, $2, 'employee', $3)`,
      [employee.email.toLowerCase(), passwordHash, employee.id]
    );

    await client.query("COMMIT");

    await auditLog(req, {
      action: "employees.register",
      entityType: "employee",
      entityId: employee.id,
      metadata: { email: employee.email },
    });

    res.json({
      message: "Registration completed",
      employeeId: employee.id,
    });

    sendEmail({
      to: employee.email,
      subject: "Регистрация завершена",
      text: `Здравствуйте, ${updatedEmployee.full_name}. Регистрация завершена. В ближайшее время придет письмо со ссылкой на обучение.`,
    }).catch((error) => console.warn("Email send failed", error));
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to register employee" });
  } finally {
    client.release();
  }
});

app.get("/api/certificates", requireAdmin, async (req, res) => {
  const { establishmentId, status, search } = req.query;
  const params = [];
  const conditions = [];

  if (establishmentId) {
    params.push(establishmentId);
    conditions.push(`certificates.establishment_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`certificates.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(employees.full_name ILIKE $${params.length} OR employees.email ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query(
      `SELECT certificates.*, employees.full_name, employees.email, establishments.name AS establishment_name
       FROM certificates
       JOIN employees ON employees.id = certificates.employee_id
       JOIN establishments ON establishments.id = certificates.establishment_id
       ${whereClause}
       ORDER BY certificates.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load certificates" });
  }
});

app.get("/api/certificates/:id/pdf", requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT certificates.*, employees.full_name, establishments.name AS establishment_name
       FROM certificates
       JOIN employees ON employees.id = certificates.employee_id
       JOIN establishments ON establishments.id = certificates.establishment_id
       WHERE certificates.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    const certificate = result.rows[0];
    const pdfBytes = await generateCertificatePdf({
      recipientName: certificate.full_name,
      qualification: defaultQualification,
      trainingCenterName,
      issuedAt: certificate.issued_at || certificate.created_at,
      certificateNumber: certificate.certificate_number,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="certificate-${certificate.certificate_number}.pdf"`
    );
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate certificate pdf" });
  }
});

app.post("/api/certificates", requireAdmin, async (req, res) => {
  const schema = z.object({
    employeeId: z.string().uuid(),
    validUntil: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const employeeResult = await query(
      "SELECT id, establishment_id, email, full_name FROM employees WHERE id = $1 AND deleted_at IS NULL",
      [parsed.data.employeeId]
    );
    if (!employeeResult.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const certificateNumber = createCertificateNumber();
    const validUntil = parsed.data.validUntil
      ? new Date(parsed.data.validUntil)
      : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    const result = await query(
      `INSERT INTO certificates (employee_id, establishment_id, certificate_number, status, valid_until)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [parsed.data.employeeId, employeeResult.rows[0].establishment_id, certificateNumber, validUntil]
    );

    await query(
      "INSERT INTO certificate_history (certificate_id, status, reason, actor) VALUES ($1, $2, $3, $4)",
      [result.rows[0].id, "active", "manual_issue", getActor(req)]
    );

    await query(
      "UPDATE employees SET status = 'certified', updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [parsed.data.employeeId]
    );

    await auditLog(req, {
      action: "certificates.create",
      entityType: "certificate",
      entityId: result.rows[0].id,
      metadata: { employeeId: parsed.data.employeeId },
    });

    res.status(201).json(result.rows[0]);

    if (employeeResult.rows.length) {
      sendEmail({
        to: employeeResult.rows[0].email,
        subject: "Сертификат оформлен",
        text: `Здравствуйте, ${employeeResult.rows[0].full_name}. Ваш сертификат оформлен. Номер: ${result.rows[0].certificate_number}.`,
      }).catch((error) => console.warn("Email send failed", error));
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to create certificate" });
  }
});

app.post("/api/certificates/:id/revoke", requireAdmin, async (req, res) => {
  const schema = z.object({
    reason: z.string().min(3),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `UPDATE certificates
       SET status = 'revoked',
           revoked_at = NOW(),
           revoked_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [parsed.data.reason, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await query(
      "INSERT INTO certificate_history (certificate_id, status, reason, actor) VALUES ($1, $2, $3, $4)",
      [req.params.id, "revoked", parsed.data.reason, getActor(req)]
    );

    await auditLog(req, {
      action: "certificates.revoke",
      entityType: "certificate",
      entityId: req.params.id,
      metadata: { reason: parsed.data.reason },
    });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke certificate" });
  }
});

app.post("/api/requests", async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(6).optional().nullable(),
    city: z.string().optional().nullable(),
    establishmentName: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `INSERT INTO requests (full_name, email, phone, city, establishment_name, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parsed.data.fullName,
        parsed.data.email || null,
        parsed.data.phone || null,
        parsed.data.city || null,
        parsed.data.establishmentName || null,
        parsed.data.message || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit request" });
  }
});

app.get("/api/requests", requireAdmin, async (req, res) => {
  const status = req.query.status;
  const params = [];
  const conditions = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query(
      `SELECT * FROM requests ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load requests" });
  }
});

app.patch("/api/requests/:id", requireAdmin, async (req, res) => {
  const schema = z.object({
    status: z.enum(["new", "in_progress", "closed"]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
  }

  try {
    const result = await query(
      `UPDATE requests SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }

    await auditLog(req, {
      action: "requests.update",
      entityType: "request",
      entityId: req.params.id,
      metadata: { status: parsed.data.status },
    });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

app.get("/api/audit-logs", requireAdmin, async (req, res) => {
  const limit = Number(req.query.limit || 100);
  try {
    const result = await query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [Math.min(limit, 500)]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load audit logs" });
  }
});

app.post("/api/training/import", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  let rows = [];
  try {
    rows = await parseSpreadsheetRows(req.file);
  } catch (error) {
    return res.status(400).json({ error: "Failed to parse file" });
  }

  const normalizedRows = rows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      const normalizedKey = normalizeHeaderKey(key);
      if (!normalizedKey) {
        return;
      }
      normalized[normalizedKey] = row[key];
    });
    return normalized;
  });

  const report = {
    processed: normalizedRows.length,
    matched: 0,
    certificatesCreated: 0,
    unmatched: [],
    errors: [],
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of normalizedRows) {
      const email = String(pickRowValue(row, ["email", "mail"]) || "").trim().toLowerCase();
      if (!email) {
        report.errors.push({ row, error: "Missing email" });
        continue;
      }

      const employeeResult = await client.query(
        "SELECT id, establishment_id, status FROM employees WHERE email = $1 AND deleted_at IS NULL",
        [email]
      );

      if (!employeeResult.rows.length) {
        report.unmatched.push({ email, row });
        continue;
      }

      const employee = employeeResult.rows[0];
      const statusRaw = pickRowValue(row, [
        "status",
        "result",
        "outcome",
        "passed",
        "результат",
        "итог",
        "статус",
        "пройден",
      ]);
      const status = parseTrainingStatus(statusRaw);
      const scoreRaw = pickRowValue(row, [
        "score",
        "resultscore",
        "scorepercent",
        "балл",
        "процент",
      ]);
      const score = scoreRaw ? Number(String(scoreRaw).replace(",", ".")) : null;

      await client.query(
        `INSERT INTO training_results (employee_id, status, score, source_file, raw_payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [employee.id, status, Number.isNaN(score) ? null : score, req.file.originalname, row]
      );

      report.matched += 1;

      if (status === "passed") {
        const existingCertificate = await client.query(
          "SELECT id FROM certificates WHERE employee_id = $1 AND status = 'active'",
          [employee.id]
        );
        if (existingCertificate.rows.length) {
          report.errors.push({ email, error: "Active certificate already exists" });
          continue;
        }

        const certificateNumber = createCertificateNumber();
        const validUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const certificate = await client.query(
          `INSERT INTO certificates (employee_id, establishment_id, certificate_number, status, valid_until)
           VALUES ($1, $2, $3, 'active', $4)
           RETURNING id, certificate_number`,
          [employee.id, employee.establishment_id, certificateNumber, validUntil]
        );

        await client.query(
          "INSERT INTO certificate_history (certificate_id, status, reason, actor) VALUES ($1, $2, $3, $4)",
          [certificate.rows[0].id, "active", "getcourse_import", getActor(req)]
        );

        await client.query(
          "UPDATE employees SET status = 'certified', updated_at = NOW() WHERE id = $1",
          [employee.id]
        );

        report.certificatesCreated += 1;

        sendEmail({
          to: email,
          subject: "Сертификат оформлен",
          text: `Здравствуйте. Ваш сертификат оформлен. Номер: ${certificate.rows[0].certificate_number}.`,
        }).catch((error) => console.warn("Email send failed", error));
      } else if (status === "failed") {
        await client.query(
          "UPDATE employees SET status = 'training_failed', updated_at = NOW() WHERE id = $1",
          [employee.id]
        );
      } else {
        await client.query(
          "UPDATE employees SET status = 'training_pending', updated_at = NOW() WHERE id = $1",
          [employee.id]
        );
      }
    }

    await client.query("COMMIT");

    await auditLog(req, {
      action: "training.import",
      entityType: "training",
      entityId: null,
      metadata: { processed: report.processed, certificatesCreated: report.certificatesCreated },
    });

    res.json(report);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to import training results" });
  } finally {
    client.release();
  }
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: error.message || "Unexpected error" });
});

app.listen(port, () => {
  console.log(`Admin API listening on port ${port}`);
});
