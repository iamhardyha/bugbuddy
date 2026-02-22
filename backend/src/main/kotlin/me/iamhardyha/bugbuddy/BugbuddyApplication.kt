package me.iamhardyha.bugbuddy

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class BugbuddyApplication

fun main(args: Array<String>) {
	runApplication<BugbuddyApplication>(*args)
}
