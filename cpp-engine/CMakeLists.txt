cmake_minimum_required(VERSION 3.16)
project(land_acquisition_engine LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
add_library(land_acquisition_engine STATIC src/feature_engineer.cpp src/model_inference.cpp)
target_include_directories(land_acquisition_engine PUBLIC include)

