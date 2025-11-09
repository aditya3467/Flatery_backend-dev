package com.Flatery.repository;

<<<<<<< HEAD
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByPhoneNumberEndingWith(String suffix);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:identifier) OR LOWER(u.email) = LOWER(:identifier) OR u.phoneNumber = :identifier")
    Optional<User> findByUsernameOrEmail(@Param("identifier") String identifier);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    // Count users having a specific role
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r = :role")
    long countByRole(@Param("role") RoleName role);

    // Count users with given role who are not owners (owner IDs stored in properties table)
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r = :role AND u.id NOT IN (SELECT DISTINCT p.ownerId FROM com.Flatery.model.property.Property p)")
    long countByRoleExcludingOwners(@Param("role") RoleName role);
=======
import com.Flatery.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
}
