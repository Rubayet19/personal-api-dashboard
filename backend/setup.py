from setuptools import setup, find_packages

setup(
    name="personal-api-dashboard",
    version="0.1.0",
    packages=find_packages(exclude=["tests", "tests.*"]),
    install_requires=[
        "fastapi>=0.115.0",
        "uvicorn>=0.34.0",
        "strawberry-graphql>=0.262.0",
        "python-jose[cryptography]>=3.4.0",
        "passlib[bcrypt]>=1.7.4",
        "python-multipart>=0.0.20",
        "pydantic[email]>=2.10.0",
        "redis>=5.0.0",
        "boto3>=1.37.0",
        "python-dotenv>=1.0.0"
    ],
) 