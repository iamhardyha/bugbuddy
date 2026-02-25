package me.iamhardyha.bugbuddy.global.exception

import me.iamhardyha.bugbuddy.global.response.ApiResponse
import me.iamhardyha.bugbuddy.global.response.ErrorCode
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler
    fun handleBugBuddyException(ex: BugBuddyException): ResponseEntity<ApiResponse<Nothing>> {
        val code = ex.errorCode
        return ResponseEntity
            .status(code.status)
            .body(ApiResponse.fail(code.name, code.message))
    }

    @ExceptionHandler
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Nothing>> {
        val message = ex.bindingResult.fieldErrors.joinToString(", ") {
            "${it.field}: ${it.defaultMessage}"
        }
        return ResponseEntity
            .badRequest()
            .body(ApiResponse.fail(ErrorCode.INVALID_INPUT.name, message))
    }

    @ExceptionHandler
    fun handleAuthentication(ex: AuthenticationException): ResponseEntity<ApiResponse<Nothing>> {
        val code = ErrorCode.UNAUTHORIZED
        return ResponseEntity
            .status(code.status)
            .body(ApiResponse.fail(code.name, code.message))
    }

    @ExceptionHandler
    fun handleAccessDenied(ex: AccessDeniedException): ResponseEntity<ApiResponse<Nothing>> {
        val code = ErrorCode.FORBIDDEN
        return ResponseEntity
            .status(code.status)
            .body(ApiResponse.fail(code.name, code.message))
    }

    @ExceptionHandler
    fun handleGeneric(ex: Exception): ResponseEntity<ApiResponse<Nothing>> {
        log.error("unhandled_exception", ex)
        val code = ErrorCode.INTERNAL_SERVER_ERROR
        return ResponseEntity
            .status(code.status)
            .body(ApiResponse.fail(code.name, code.message))
    }
}
