# Andar 1: o Render (e qualquer host) compila o JAR. target/ não vai no Git.
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /src
COPY pom.xml .
COPY src src
RUN mvn -B -DskipTests package

# Andar 2: só o JRE 25. 256m cabe no plano Free do Render (512 MB).
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /src/target/dinosaur-world-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8082
ENV JAVA_OPTS="-Xmx256m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
