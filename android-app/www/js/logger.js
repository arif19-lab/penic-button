/**
 * logger.js
 * Professional structured logging utility for the Panic Button frontend.
 * Supports log levels, namespaces, and styled console output.
 */

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor(namespace, level = LogLevel.INFO) {
        this.namespace = namespace;
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    _formatTime() {
        const now = new Date();
        const pad = (n, m = 2) => String(n).padStart(m, '0');
        return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
    }

    _log(level, levelName, style, args) {
        if (level < this.level) return;
        const time = this._formatTime();
        const prefix = `[%c${time}%c] [%c${this.namespace}%c] [%c${levelName}%c]`;
        
        const styles = [
            'color: #888', '',
            'color: #007bff; font-weight: bold', '',
            style, ''
        ];

        console.log(prefix, ...styles, ...args);
    }

    debug(...args) {
        this._log(LogLevel.DEBUG, 'DEBUG', 'color: #6c757d', args);
    }

    info(...args) {
        this._log(LogLevel.INFO, 'INFO', 'color: #28a745', args);
    }

    warn(...args) {
        this._log(LogLevel.WARN, 'WARN', 'color: #ffc107', args);
    }

    error(...args) {
        this._log(LogLevel.ERROR, 'ERROR', 'color: #dc3545; font-weight: bold', args);
    }
}

// Global factory for getting loggers
window.LoggerFactory = {
    _loggers: {},
    globalLevel: LogLevel.INFO,

    setGlobalLevel(level) {
        this.globalLevel = level;
        for (const ns in this._loggers) {
            this._loggers[ns].setLevel(level);
        }
    },

    getLogger(namespace) {
        if (!this._loggers[namespace]) {
            this._loggers[namespace] = new Logger(namespace, this.globalLevel);
        }
        return this._loggers[namespace];
    }
};

// Expose LogLevel globally for easy access
window.LogLevel = LogLevel;
