module.exports = {
    apps: [
        {
            name: "frontend",
            cwd: "./frontend",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                APP_PASSWORD: "9#kL!mP2$vR5*zXqG&3b@7wY%8nA#4cD"
            }
        },
        {
            name: "backend",
            cwd: "./backend",
            script: "venv/bin/uvicorn",
            args: "main:app --host 0.0.0.0 --port 8000",
            interpreter: "python3"
        }
    ]
};
