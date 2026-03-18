package main.java.com.fullStack.expenseTracker.dataSeeders;

import com.fullStack.expenseTracker.enums.ERole;
import com.fullStack.expenseTracker.models.Role;
import com.fullStack.expenseTracker.models.User;
import com.fullStack.expenseTracker.repository.RoleRepository;
import com.fullStack.expenseTracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Component
public class UserDataSeeder {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @EventListener
    @Transactional
    public void seedAdminUser(ContextRefreshedEvent event) {
        String adminEmail = "admin@mywallet.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Admin Role not found."));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);

            User admin = new User(
                    "admin",
                    adminEmail,
                    passwordEncoder.encode("admin123"),
                    null, // No verification code needed
                    null,
                    true, // Enabled by default
                    roles);

            userRepository.save(admin);
        }
    }
}
