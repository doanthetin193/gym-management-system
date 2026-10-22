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
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.service.MemberAccessService;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.membership.service.MembershipPeriodStatistics;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanResponse;
import com.gymduongdouble.backend.membership.web.dto.PublicMembershipPlanResponse;
import com.gymduongdouble.backend.common.validation.VietnamPhoneNormalizer;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.RateLimitExceededException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.InMemoryRateLimiter;
import com.gymduongdouble.backend.common.security.JwtProperties;
import com.gymduongdouble.backend.common.security.JwtService;
import com.gymduongdouble.backend.common.security.PasswordPolicy;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.pt.domain.PtAssignment;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import com.gymduongdouble.backend.pt.service.PtAssignmentPolicy;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementRequest;
import com.gymduongdouble.backend.pt.web.dto.PtProfileResponse;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.validation.Validation;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
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
	void portalAccountRequiresAnEffectiveMembership() {
		Member member = new Member();
		member.setId(1L);
		member.setStatus(com.gymduongdouble.backend.common.enums.MemberStatus.ACTIVE);
		member.setPhone("0901000004");

		MemberRepository memberRepository = mock(MemberRepository.class);
		MemberMembershipRepository membershipRepository = mock(MemberMembershipRepository.class);
		when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
		when(membershipRepository.findByMemberIdOrderByStartDateDesc(1L)).thenReturn(List.of());

		MemberService service = new MemberService(
			memberRepository,
			membershipRepository,
			null,
			null,
			null,
			null,
			null,
			null,
			mock(MemberAccessService.class),
			new MembershipLifecyclePolicy(),
			new VietnamPhoneNormalizer()
		);

		assertThrows(BadRequestException.class, () -> service.createPortalAccount(1L, "Portal2026"));
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
	void loginRateLimiterLocksForFullWindowOnFifthFailureAndClearsAfterSuccess() {
		InMemoryRateLimiter rateLimiter = new InMemoryRateLimiter();
		String account = "member@example.com";
		String clientIp = "127.0.0.1";

		for (int attempt = 0; attempt < 4; attempt++) {
			rateLimiter.requireLoginAllowed(account, clientIp);
			rateLimiter.recordLoginFailure(account, clientIp);
		}

		RateLimitExceededException fifthFailure = assertThrows(
			RateLimitExceededException.class,
			() -> rateLimiter.recordLoginFailure(account, clientIp)
		);
		assertTrue(fifthFailure.getRetryAfterSeconds() >= 899);
		assertThrows(RateLimitExceededException.class, () -> rateLimiter.requireLoginAllowed(account, clientIp));
		rateLimiter.clearLoginFailures(account, clientIp);
		rateLimiter.requireLoginAllowed(account, clientIp);
	}

	@Test
	void pageResponseSlicesTheAuthorizedResultSetAndKeepsTotalMetadata() {
		PageResponse<Integer> page = PageResponse.fromItems(List.of(1, 2, 3, 4, 5), 1, 2, 10);

		assertEquals(List.of(3, 4), page.items());
		assertEquals(5, page.totalItems());
		assertEquals(3, page.totalPages());
		assertFalse(page.first());
		assertFalse(page.last());
	}

	@Test
	void sensitiveRateLimiterAllowsTenRequestsThenBlocksTheNextOne() {
		InMemoryRateLimiter rateLimiter = new InMemoryRateLimiter();

		for (int attempt = 0; attempt < 10; attempt++) {
			assertTrue(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
		}
		assertFalse(rateLimiter.tryConsumeSensitiveRequest("ai-advisor", "user:owner"));
	}

	@Test
	void membershipPeriodStatisticsCountsFirstRegistrationAndRenewalByDistinctMember() {
		MembershipPeriodStatistics statistics = new MembershipPeriodStatistics();
		LocalDate start = LocalDate.of(2026, 10, 1);
		LocalDate end = LocalDate.of(2026, 10, 31);

		MemberMembership firstThenRenewed = membership(1L, 1L, LocalDate.of(2026, 10, 2));
		MemberMembership sameMemberRenewal = membership(1L, 2L, LocalDate.of(2026, 10, 20));
		MemberMembership priorThenRenewed = membership(2L, 3L, LocalDate.of(2026, 9, 1));
		MemberMembership laterRenewal = membership(2L, 4L, LocalDate.of(2026, 10, 8));
		MemberMembership anotherLaterRenewal = membership(2L, 5L, LocalDate.of(2026, 10, 22));
		MemberMembership cancelledRegistration = membership(3L, 6L, LocalDate.of(2026, 10, 5));
		cancelledRegistration.setStatus(MembershipStatus.CANCELLED);

		var counts = statistics.count(
			List.of(firstThenRenewed, sameMemberRenewal, priorThenRenewed, laterRenewal, anotherLaterRenewal, cancelledRegistration),
			start,
			end
		);

		assertEquals(1, counts.newMembers());
		assertEquals(2, counts.renewedMembers());
	}

	@Test
	void publicMembershipPlanResponseContainsOnlyPublicPlanValues() {
		MembershipPlan plan = new MembershipPlan();
		plan.setId(9L);
		plan.setName("Gói PT test");
		plan.setDurationDays(30);
		plan.setDefaultPrice(BigDecimal.valueOf(1_000_000));
		var response = PublicMembershipPlanResponse.from(plan);

		assertEquals(9L, response.id());
		assertEquals("Gói PT test", response.name());
		assertEquals(BigDecimal.valueOf(1_000_000), response.price());
	}

	@Test
	void currentPtAndPlanContractsDoNotExposePayrollOrPriceRatioFields() {
		var profileEntityFields = java.util.Arrays.stream(PtProfile.class.getDeclaredFields())
			.map(java.lang.reflect.Field::getName)
			.toList();
		var profileResponseFields = java.util.Arrays.stream(PtProfileResponse.class.getRecordComponents())
			.map(java.lang.reflect.RecordComponent::getName)
			.toList();
		var planResponseFields = java.util.Arrays.stream(MembershipPlanResponse.class.getRecordComponents())
			.map(java.lang.reflect.RecordComponent::getName)
			.toList();

		assertFalse(profileEntityFields.contains("baseSalary"));
		assertFalse(profileEntityFields.contains("teachingRate"));
		assertFalse(profileEntityFields.contains("salesCommissionRate"));
		assertFalse(profileResponseFields.contains("baseSalary"));
		assertFalse(profileResponseFields.contains("teachingRate"));
		assertFalse(profileResponseFields.contains("salesCommissionRate"));
		assertFalse(planResponseFields.contains("priceRatio"));
	}

	private MemberMembership membership(LocalDate startDate, LocalDate endDate) {
		MemberMembership membership = new MemberMembership();
		membership.setStatus(MembershipStatus.ACTIVE);
		membership.setStartDate(startDate);
		membership.setEndDate(endDate);
		return membership;
	}

	private MemberMembership membership(Long memberId, Long membershipId, LocalDate startDate) {
		Member member = new Member();
		member.setId(memberId);
		MemberMembership membership = membership(startDate, startDate.plusMonths(1));
		membership.setId(membershipId);
		membership.setMember(member);
		return membership;
	}
}
