pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Personal Finance Tracker...'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('CI/CD Success') {
            steps {
                echo 'Personal Finance Tracker CI/CD completed successfully!'
            }
        }
    }
}