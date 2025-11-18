package com.Flatery.Controller.payment;

import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.payment.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService service; 
    private final UserRepository userRepository;

    /**
     * Get receipt by transaction ID
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<?> getReceiptByTransaction(@PathVariable Long transactionId) {
        try {
            return service.findByTransactionId(transactionId)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Get receipt by receipt ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReceiptById(@PathVariable Long id) {
        try {
            return service.findById(id)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Helper method to get authenticated user's ID
     */
    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    public record ErrorResponse(String error) {}
}
