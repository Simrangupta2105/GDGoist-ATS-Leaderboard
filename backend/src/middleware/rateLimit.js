/**
 * PHASE 3: Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse and ensures platform stability.
 * Uses in-memory store (suitable for single-instance deployment).
 * For multi-instance, consider Redis-backed rate limiting.
 */

const rateLimit = require('express-rate-limit')

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health'
    }
})

/**
 * Auth endpoints rate limiter (stricter)
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * Admin analytics rate limiter
 * 30 requests per 15 minutes per IP
 */
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        error: 'Too many admin requests, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * File upload rate limiter (very strict)
 * 10 uploads per hour per IP
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        error: 'Too many file uploads, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
})

module.exports = {
    generalLimiter,
    authLimiter,
    adminLimiter,
    uploadLimiter
}
