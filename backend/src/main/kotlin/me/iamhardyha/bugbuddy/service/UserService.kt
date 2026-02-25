package me.iamhardyha.bugbuddy.service

import me.iamhardyha.bugbuddy.global.exception.BugBuddyException
import me.iamhardyha.bugbuddy.global.response.ErrorCode
import me.iamhardyha.bugbuddy.model.entity.UserEntity
import me.iamhardyha.bugbuddy.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository,
) {
    fun findById(id: Long): UserEntity =
        userRepository.findById(id).orElseThrow { BugBuddyException(ErrorCode.USER_NOT_FOUND) }
}
