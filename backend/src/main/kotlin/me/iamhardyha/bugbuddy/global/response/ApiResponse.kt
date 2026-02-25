package me.iamhardyha.bugbuddy.global.response

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ErrorBody? = null,
) {
    companion object {
        fun <T> ok(data: T): ApiResponse<T> = ApiResponse(success = true, data = data)

        fun <T> ok(): ApiResponse<T> = ApiResponse(success = true)

        fun <T> fail(code: String, message: String): ApiResponse<T> =
            ApiResponse(success = false, error = ErrorBody(code = code, message = message))
    }
}

data class ErrorBody(
    val code: String,
    val message: String,
)
