CXX := g++
CXXFLAGS := -O2 -g -Wall -Wextra -Wpedantic -std=c++17
LDFLAGS :=

TESTS := test_command test_faults test_attitude

.PHONY: all clean

all: $(TESTS)

test_command: test_command.cpp
	$(CXX) $(CXXFLAGS) ../src/command.cpp -I../src -o $@ $< $(LDFLAGS)

test_faults: test_faults.cpp
	$(CXX) $(CXXFLAGS) ../src/faults.cpp -I../src -o $@ $< $(LDFLAGS)

test_attitude: test_attitude.cpp
	$(CXX) $(CXXFLAGS) ../src/attitude.cpp -I../src -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TESTS)
