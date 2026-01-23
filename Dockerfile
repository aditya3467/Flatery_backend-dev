<<<<<<< Updated upstream
<<<<<<< Updated upstream
# Multi-stage build for Flatery Backend

# Stage 1: Build with Maven
=======
# ---- Build stage: use Maven + JDK 17 to build the jar ----
>>>>>>> Stashed changes
=======
# ---- Build stage: use Maven + JDK 17 to build the jar ----
>>>>>>> Stashed changes
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

<<<<<<< Updated upstream
<<<<<<< Updated upstream
# Copy pom.xml and download dependencies (better layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime with JRE
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port (Render will set PORT env variable)
EXPOSE 8080

# Run the application
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar"]
=======
=======
>>>>>>> Stashed changes
# Copy Maven descriptor first (better caching)
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -q clean package -DskipTests

# ---- Run stage: use lightweight JRE to run the jar ----
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render will set $PORT. We also expose 8080 for local runs.
EXPOSE 8080

ENV JAVA_OPTS=""

# Use SPRING_PROFILES_ACTIVE from env (prod on Render),
# and bind server.port to $PORT (Render requirement)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} --server.port=${PORT:-8080}"]
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
