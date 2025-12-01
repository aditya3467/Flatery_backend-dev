# ---- Build stage: use Maven + JDK 17 to build the jar ----
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

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
