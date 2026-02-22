package me.iamhardyha.bugbuddy.model.entity

import java.io.Serializable

data class QuestionTagId(
    var questionId: Long = 0,
    var tagId: Long = 0
) : Serializable
