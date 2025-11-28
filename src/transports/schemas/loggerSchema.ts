// transports/schemas/loggerSchema.ts - Database Schema for Logger

/**
 * Common fields cho logger tables
 */
const LoggerCommonFields = {
  id: {
    name: "id",
    type: "integer" as const,
    primaryKey: true,
    autoIncrement: true,
    required: true,
    description: "ID tự động tăng",
  },

  timestamp: {
    name: "timestamp",
    type: "timestamp" as const,
    required: true,
    index: true,
    description: "Thời gian log",
  },

  level: {
    name: "level",
    type: "varchar" as const,
    length: 20,
    required: true,
    index: true,
    enum: ["trace", "debug", "info", "warn", "error"],
    description: "Mức độ log",
  },

  module: {
    name: "module",
    type: "varchar" as const,
    length: 100,
    required: true,
    index: true,
    description: "Tên module",
  },

  message: {
    name: "message",
    type: "text" as const,
    required: true,
    description: "Nội dung log",
  },

  data: {
    name: "data",
    type: "text" as const,
    nullable: true,
    description: "Dữ liệu bổ sung (JSON string)",
  },

  metadata: {
    name: "metadata",
    type: "text" as const,
    nullable: true,
    description: "Metadata (JSON string)",
  },

  session_id: {
    name: "session_id",
    type: "varchar" as const,
    length: 100,
    nullable: true,
    index: true,
    description: "Session ID",
  },

  created_at: {
    name: "created_at",
    type: "timestamp" as const,
    default: "CURRENT_TIMESTAMP",
    description: "Thời gian tạo bản ghi",
  },
};

/**
 * Logger Database Schema
 */
export const loggerSchema: any = {
  version: "1.0",
  database_name: "logger",
  description: "Database lưu trữ logs của hệ thống",

  schemas: {
    // Bảng logs chính
    logs: {
      description: "Bảng lưu trữ tất cả logs",
      cols: [
        { ...LoggerCommonFields.id },
        { ...LoggerCommonFields.timestamp },
        { ...LoggerCommonFields.level },
        { ...LoggerCommonFields.module },
        { ...LoggerCommonFields.message },
        { ...LoggerCommonFields.data },
        { ...LoggerCommonFields.metadata },
        { ...LoggerCommonFields.session_id },
        { ...LoggerCommonFields.created_at },
      ],
      indexes: [
        {
          name: "idx_logs_timestamp",
          fields: ["timestamp"],
          description: "Index cho timestamp để query nhanh",
        },
        {
          name: "idx_logs_level",
          fields: ["level"],
          description: "Index cho level",
        },
        {
          name: "idx_logs_module",
          fields: ["module"],
          description: "Index cho module",
        },
        {
          name: "idx_logs_session_id",
          fields: ["session_id"],
          description: "Index cho session_id",
        },
        {
          name: "idx_logs_level_module",
          fields: ["level", "module"],
          description: "Index composite cho level và module",
        },
        {
          name: "idx_logs_timestamp_level",
          fields: ["timestamp", "level"],
          description: "Index composite cho timestamp và level",
        },
      ],
    },

    // Bảng error logs riêng (optional - để query nhanh hơn)
    error_logs: {
      description: "Bảng lưu trữ riêng error logs",
      cols: [
        { ...LoggerCommonFields.id },
        { ...LoggerCommonFields.timestamp },
        { ...LoggerCommonFields.module },
        { ...LoggerCommonFields.message },
        {
          name: "stack_trace",
          type: "text" as const,
          nullable: true,
          description: "Stack trace của error",
        },
        { ...LoggerCommonFields.data },
        { ...LoggerCommonFields.metadata },
        { ...LoggerCommonFields.session_id },
        { ...LoggerCommonFields.created_at },
      ],
      indexes: [
        {
          name: "idx_error_logs_timestamp",
          fields: ["timestamp"],
          description: "Index cho timestamp",
        },
        {
          name: "idx_error_logs_module",
          fields: ["module"],
          description: "Index cho module",
        },
      ],
    },

    // Bảng log statistics
    log_statistics: {
      description: "Bảng thống kê logs theo ngày/module",
      cols: [
        {
          name: "id",
          type: "integer" as const,
          primaryKey: true,
          autoIncrement: true,
          required: true,
        },
        {
          name: "date",
          type: "date" as const,
          required: true,
          index: true,
          description: "Ngày thống kê",
        },
        { ...LoggerCommonFields.module },
        { ...LoggerCommonFields.level },
        {
          name: "count",
          type: "integer" as const,
          required: true,
          default: 0,
          description: "Số lượng logs",
        },
        { ...LoggerCommonFields.created_at },
        {
          name: "updated_at",
          type: "timestamp" as const,
          default: "CURRENT_TIMESTAMP",
          description: "Thời gian cập nhật",
        },
      ],
      indexes: [
        {
          name: "idx_stats_date_module_level",
          fields: ["date", "module", "level"],
          unique: true,
          description: "Index unique composite",
        },
      ],
    },

    // Bảng log sessions
    log_sessions: {
      description: "Bảng quản lý sessions",
      cols: [
        {
          name: "id",
          type: "integer" as const,
          primaryKey: true,
          autoIncrement: true,
          required: true,
        },
        { ...LoggerCommonFields.session_id },
        {
          name: "started_at",
          type: "timestamp" as const,
          required: true,
          description: "Thời gian bắt đầu session",
        },
        {
          name: "ended_at",
          type: "timestamp" as const,
          nullable: true,
          description: "Thời gian kết thúc session",
        },
        {
          name: "total_logs",
          type: "integer" as const,
          default: 0,
          description: "Tổng số logs trong session",
        },
        {
          name: "error_count",
          type: "integer" as const,
          default: 0,
          description: "Số lượng errors",
        },
        {
          name: "status",
          type: "varchar" as const,
          length: 20,
          default: "active",
          enum: ["active", "ended", "expired"],
          description: "Trạng thái session",
        },
        { ...LoggerCommonFields.created_at },
      ],
      indexes: [
        {
          name: "idx_sessions_session_id",
          fields: ["session_id"],
          unique: true,
          description: "Index unique cho session_id",
        },
        {
          name: "idx_sessions_status",
          fields: ["status"],
          description: "Index cho status",
        },
      ],
    },
  },
};

/**
 * Export schema name for easier import
 */
export const LOGGER_SCHEMA_NAME = "logger";
export const LOGGER_TABLES = {
  LOGS: "logs",
  ERROR_LOGS: "error_logs",
  LOG_STATISTICS: "log_statistics",
  LOG_SESSIONS: "log_sessions",
} as const;
