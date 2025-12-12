import com.Flatery.model.User;
import com.Flatery.model.property.Property;

public class TestDataBuilder {
    private String username;
    private String password;
    private String email;
    private String propertyName;

    public TestDataBuilder withUsername(String username) {
        this.username = username;
        return this;
    }

    public TestDataBuilder withPassword(String password) {
        this.password = password;
        return this;
    }

    public TestDataBuilder withEmail(String email) {
        this.email = email;
        return this;
    }

    public TestDataBuilder withPropertyName(String propertyName) {
        this.propertyName = propertyName;
        return this;
    }

    // public User buildUser() {
    //     return new User(username, password, email);
    // }

    // public Property buildProperty() {
    //     return new Property(propertyName);
    // }
}