import { randomUUID } from "node:crypto";

export class SessionStore {
  async create(_value) {
    throw new Error("SessionStore.create não implementado");
  }

  async get(_id) {
    throw new Error("SessionStore.get não implementado");
  }

  async delete(_id) {
    throw new Error("SessionStore.delete não implementado");
  }

  async refresh(_id) {
    throw new Error("SessionStore.refresh não implementado");
  }
}

export class MemorySessionStore extends SessionStore {
  constructor({ ttlMs, now = () => Date.now() }) {
    super();
    this.ttlMs = ttlMs;
    this.now = now;
    this.sessions = new Map();
  }

  async create(value) {
    const id = randomUUID();
    this.sessions.set(id, { value, expiresAt: this.now() + this.ttlMs });
    return id;
  }

  async get(id) {
    if (!id) return null;
    const entry = this.sessions.get(id);
    if (!entry) return null;

    if (entry.expiresAt <= this.now()) {
      this.sessions.delete(id);
      return null;
    }

    return entry.value;
  }

  async delete(id) {
    return this.sessions.delete(id);
  }

  async refresh(id) {
    const value = await this.get(id);
    if (!value) return false;
    this.sessions.set(id, { value, expiresAt: this.now() + this.ttlMs });
    return true;
  }
}

export class MemoryOneTimeStateStore {
  constructor({ ttlMs, now = () => Date.now() }) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.states = new Map();
  }

  async create(value) {
    const id = randomUUID();
    this.states.set(id, { value, expiresAt: this.now() + this.ttlMs });
    return id;
  }

  async consume(id) {
    if (!id) return null;
    const entry = this.states.get(id);
    this.states.delete(id);
    if (!entry || entry.expiresAt <= this.now()) return null;
    return entry.value;
  }
}

export class PostgresOneTimeStateStore {
  constructor({ ttlMs, queryFn }) {
    this.ttlMs = ttlMs;
    this.query = queryFn;
  }

  async create(value) {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.query(
      `INSERT INTO oauth_states (id, value, expires_at) VALUES ($1, $2::jsonb, $3)`,
      [id, JSON.stringify(value), expiresAt]
    );
    return id;
  }

  async consume(id) {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }

    const result = await this.query(
      `DELETE FROM oauth_states
       WHERE id = $1 AND expires_at > NOW()
       RETURNING value`,
      [id]
    );
    return result.rows[0]?.value || null;
  }
}
