CXX := g++
CXXFLAGS := -O2 -g -Wall -Wextra -Wpedantic -std=c++17 -pthread -D_GNU_SOURCE
LDFLAGS := -pthread

SRC := src/main.cpp
TARGET := sat_core

# Optional ASAN build: make ASAN=1
ifeq ($(ASAN),1)
  CXXFLAGS += -fsanitize=address -fno-omit-frame-pointer
  LDFLAGS += -fsanitize=address
endif

.PHONY: all clean test asan

all: $(TARGET)

$(TARGET): $(SRC) src/*.cpp
	$(CXX) $(CXXFLAGS) src/*.cpp -o $(TARGET) $(LDFLAGS)

asan:
	$(MAKE) ASAN=1

clean:
	rm -f $(TARGET)
	rm -f tests/test_*

test: $(TARGET)
	$(MAKE) -C tests
