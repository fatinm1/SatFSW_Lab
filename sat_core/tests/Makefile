CXX ?= g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pthread
.PHONY: all clean
all:
	$(CXX) $(CXXFLAGS) commands.cpp ../src/command.cpp -o command_tests
	./command_tests
clean:
	rm -f command_tests
