package com.Flatery.exception.help;

public class ComplaintNotFoundException extends RuntimeException {

    public ComplaintNotFoundException() {
        super();
    }

    public ComplaintNotFoundException(String message) {
        super(message);
    }

    public ComplaintNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
