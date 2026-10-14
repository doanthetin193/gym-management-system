package com.gymduongdouble.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.gymduongdouble.backend.ai.config.GroqAiProperties;
import com.gymduongdouble.backend.auth.web.dto.LoginRequest;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;

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
				null,
				"Thu học phí"
			);

			assertEquals(0, validator.validate(request).size());
		}
	}
}
