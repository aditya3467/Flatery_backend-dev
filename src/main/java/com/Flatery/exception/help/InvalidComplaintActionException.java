package com.Flatery.exception.help;

public class InvalidComplaintActionException extends RuntimeException {

    public InvalidComplaintActionException() {
        super();
    }

    public InvalidComplaintActionException(String message) {
        super(message);
    }

    public InvalidComplaintActionException(String message, Throwable cause) {
        super(message, cause);
    }
}
