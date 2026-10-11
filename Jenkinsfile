pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Personal Finance Tracker...'
                checkout scm
            }
        }

        stage('Verify Project Structure') {
            steps {
                bat 'dir'
                bat 'set "PATH=%PATH%;C:\\Users\\kalva\\AppData\\Local\\Programs\\Docker\\DockerDesktop\\resources\\bin"'
                bat 'docker --version'
                bat 'docker compose version'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building backend and frontend Docker images...'

                bat 'docker compose build'
            }
        }

        stage('Stop Existing Containers') {
            steps {
                echo 'Stopping existing containers...'

                bat 'docker compose down'
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Starting Personal Finance Tracker using Docker Compose...'

                bat 'docker compose up -d'
            }
        }

        stage('Verify Containers') {
            steps {
                echo 'Checking running containers...'

                bat 'docker compose ps'
            }
        }

        stage('Test Backend') {
            steps {
                echo 'Testing backend API...'

                bat 'curl.exe -f http://localhost:5000'
            }
        }

        stage('Test Frontend') {
            steps {
                echo 'Testing frontend application...'

                bat 'curl.exe -f http://localhost:8081'
            }
        }

        stage('CI/CD Success') {
            steps {
                echo '=============================================='
                echo 'Personal Finance Tracker CI/CD completed!'
                echo 'Docker images built successfully.'
                echo 'Containers deployed successfully.'
                echo 'Backend:  http://localhost:5000'
                echo 'Frontend: http://localhost:8081'
                echo '=============================================='
            }
        }
    }

    post {
        failure {
            echo 'CI/CD pipeline failed. Check the stage logs above.'
        }

        success {
            echo 'SUCCESS: Personal Finance Tracker is running!'
        }
    }
}