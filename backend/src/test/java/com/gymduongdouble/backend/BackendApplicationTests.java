package com.gymduongdouble.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.gymduongdouble.backend.ai.config.GroqAiProperties;
import com.gymduongdouble.backend.auth.web.dto.LoginRequest;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.MembershipStatus;
import com.gymduongdouble.backend.common.enums.PtAssignmentStatus;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.common.validation.VietnamPhoneNormalizer;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.RateLimitExceededException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.InMemoryRateLimiter;
import com.gymduongdouble.backend.common.security.JwtProperties;
import com.gymduongdouble.backend.common.security.JwtService;
import com.gymduongdouble.backend.common.security.PasswordPolicy;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.service.PtAssignmentPolicy;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementRequest;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.validation.Validation;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import tools.jackson.databind.ObjectMapper;

class BackendApplicationTests {

	@Test
	void groqKeysAreTrimmedDeduplicatedAndOrdered() {
		GroqAiProperties properties = new GroqAiProperties();
		properties.setApiKeys(" key-one, key-two ,key-one,, key-three ");

		assertEquals(
			java.util.List.of("key-one", "key-two", "key-three"),
			properties.resolvedApiKeys()
		);
	}

	@Test
	void loginRequestDoesNotExposePasswordInLogs() {
		LoginRequest request = new LoginRequest("owner@gymduongdouble.local", "secret-password", false);

		String rendered = request.toString();

		assertFalse(rendered.contains("secret-password"));
		assertEquals("LoginRequest[email=owner@gymduongdouble.local, password=***, rememberMe=false]", rendered);
	}

	@Test
	void paymentRequestRequiresPositiveAmountAndPaymentMethod() {
		try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
			var validator = validatorFactory.getValidator();
			CreatePaymentRequest request = new CreatePaymentRequest(
				1L,
				null,
				null,
				null,
				BigDecimal.ZERO,
				null,
				"Thu thử"
			);

			var violations = validator.validate(request);

			assertEquals(2, violations.size());
		}
	}

	@Test
	void validPaymentRequestPassesValidation() {
		try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
			var validator = validatorFactory.getValidator();
			CreatePaymentRequest request = new CreatePaymentRequest(
				1L,
				null,
				null,
				null,
				BigDecimal.valueOf(300_000),
				PaymentMethod.CASH,
				"Thu học phí"
			);

			assertEquals(0, validator.validate(request).size());
		}
	}

	@Test
	void ptAssignmentPolicyHonorsAssignmentDates() {
		PtAssignment assignment = new PtAssignment();
		assignment.setStatus(PtAssignmentStatus.ACTIVE);
		assignment.setStartDate(LocalDate.of(2026, 10, 1));
		assignment.setEndDate(LocalDate.of(2026, 10, 10));
		PtAssignmentPolicy policy = new PtAssignmentPolicy(null, null, null);

		assertFalse(policy.isEffective(assignment, LocalDate.of(2026, 9, 30)));
		assertTrue(policy.isEffective(assignment, LocalDate.of(2026, 10, 10)));
		assertFalse(policy.isEffective(assignment, LocalDate.of(2026, 10, 11)));
	}

	@Test
	void membershipLifecyclePrefersEffectiveMembershipAndReportsExpiration() {
		MemberMembership expired = membership(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
		MemberMembership active = membership(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
		MemberMembership future = membership(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30));
		MembershipLifecyclePolicy policy = new MembershipLifecyclePolicy();

		assertEquals(active, policy.preferredMembership(List.of(expired, active, future), LocalDate.of(2026, 10, 15)).orElseThrow());
		assertEquals(MembershipStatus.EXPIRED, policy.effectiveStatus(expired, LocalDate.of(2026, 10, 15)));
		assertTrue(policy.isEffective(active, LocalDate.of(2026, 10, 15)));

		MemberMembership pendingPayment = membership(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
		pendingPayment.setStatus(MembershipStatus.PENDING_PAYMENT);
		assertFalse(policy.isEffective(pendingPayment, LocalDate.of(2026, 10, 15)));
	}

	@Test
	void bodyMeasurementRequiresAtLeastOneMetric() {
		try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
			var validator = validatorFactory.getValidator();
			BodyMeasurementRequest emptyMeasurement = new BodyMeasurementRequest(
				LocalDate.of(2026, 10, 15), null, null, null, null, null, null, null, null, null
			);
			BodyMeasurementRequest validMeasurement = new BodyMeasurementRequest(
				LocalDate.of(2026, 10, 15), null, BigDecimal.valueOf(70), null, null, null, null, null, null, null
			);

			assertEquals(1, validator.validate(emptyMeasurement).size());
			assertEquals(0, validator.validate(validMeasurement).size());
		}
	}

	@Test
	void vietnamPhoneNormalizerUsesOneCanonicalMobileFormat() {
		VietnamPhoneNormalizer normalizer = new VietnamPhoneNormalizer();

		assertEquals("0901000004", normalizer.normalizeRequired("0901 000 004", "Số điện thoại"));
		assertEquals("0901000004", normalizer.normalizeRequired("+84 901-000-004", "Số điện thoại"));
		assertEquals("0901000004", normalizer.normalizeRequired("84901000004", "Số điện thoại"));
		assertEquals("0901000004", normalizer.normalizeForLookup("0901 000 004"));
	}

	@Test
	void jwtTokenIsRejectedAfterPasswordResetRevokesActiveTokens() {
		User user = new User();
		user.setId(1L);
		user.setEmail("owner@gym.local");
		user.setFullName("Chủ phòng");
		user.setPasswordHash("hash");
		JwtService jwtService = new JwtService(
			new JwtProperties("test-secret-for-jwt-token-version", 120),
			new ObjectMapper()
		);

		String token = jwtService.generateAccessToken(new AuthenticatedUser(user), 120);
		var claims = jwtService.parseAndValidate(token);
		jwtService.requireCurrentTokenVersion(claims, new AuthenticatedUser(user));

		user.revokeActiveTokens();

		assertThrows(
			BadRequestException.class,
			() -> jwtService.requireCurrentTokenVersion(claims, new AuthenticatedUser(user))
		);
	}

	@Test
	void passwordPolicyRequiresLettersDigitsAndNonIdentifierValue() {
		PasswordPolicy policy = new PasswordPolicy();

		assertEquals("GymPass2026", policy.requireValid("GymPass2026", "owner@gym.local", "0901000004"));
		assertThrows(BadRequestException.class, () -> policy.requireValid("abcdefghi", "owner@gym.local"));
		assertThrows(BadRequestException.class, () -> policy.requireValid("12345678", "owner@gym.local"));
		assertThrows(BadRequestException.class, () -> policy.requireValid("0901000004", "owner@gym.local", "0901000004"));
	}

	@Test
	void loginRateLimiterBlocksAfterFiveFailedAttemptsAndClearsAfterSuccess() {
		InMemoryRateLimiter rateLimiter = new InMemoryRateLimiter();
		String account = "member@example.com";
		String clientIp = "127.0.0.1";

		for (int attempt = 0; attempt < 5; attempt++) {
			rateLimiter.requireLoginAllowed(account, clientIp);
			rateLimiter.recordLoginFailure(account, clientIp);
		}

		assertThrows(RateLimitExceededException.class, () -> rateLimiter.requireLoginAllowed(account, clientIp));
		rateLimiter.clearLoginFailures(account, clientIp);
		rateLimiter.requireLoginAllowed(account, clientIp);
	}

	@Test
	void sensitiveRateLimiterAllowsTenRequestsThenBlocksTheNextOne() {
		InMemoryRateLimiter rateLimiter = new InMemoryRateLimiter();

		for (int attempt = 0; attempt < 10; attempt++) {
			assertTrue(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
		}
		assertFalse(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
	}

	private MemberMembership membership(LocalDate startDate, LocalDate endDate) {
		MemberMembership membership = new MemberMembership();
		membership.setStatus(MembershipStatus.ACTIVE);
		membership.setStartDate(startDate);
		membership.setEndDate(endDate);
		return membership;
	}
}
