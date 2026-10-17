# Host público precisa do JDK 25 empacotado. Não dependa da versão Java do PaaS.
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY target/dinosaur-world-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","app.jar"]
