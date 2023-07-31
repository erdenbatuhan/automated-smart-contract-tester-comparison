#!/bin/bash

RUN_COUNT=11

# The command to be executed
command_to_run="$1"

# Function to run the command and extract the time from the output
run_command_and_get_time() {
  output=$(eval "$command_to_run" 2>&1) # Execute the command
  time=$(echo "$output" | grep -o -E '([0-9]+[.][0-9]+) real' | awk '{print $1}')
  echo "$time"
}

# Redirect everything printed to the console to the file
filename=$(echo "$command_to_run" | awk -v remove="/usr/bin/time " '{gsub(remove, ""); print}')  # Remove /usr/bin/time command
filename=$(echo "$filename" | tr ' ' '_' | tr ':' '_' | tr '/' '.').txt  # Generate the filename based on the command
exec > "./out/$filename"

# Array to store all the time values
declare -a times_array

# Run the command 20 times and store the time for each run in the array
for ((i=1; i<=RUN_COUNT; i++)); do
  time=$(run_command_and_get_time)
  times_array+=("$time")
  echo "Run $i - Time: $time"
  # sleep 1
done

# Function to calculate the median from an array
calculate_median() {
  local arr=("$@")    # Declares a local array 'arr' and assigns all the arguments passed to the function into it.
  local n=${#arr[@]}  # Declares a local variable 'n' and assigns the number of elements in the 'arr' array to it.

  local sorted_arr=($(printf '%s\n' "${arr[@]}" | sort -n))  # Sorts the elements of the 'arr' array in ascending order.

  local mid=$((n/2))  # Declares a local variable 'mid' and calculates the index of the middle element in the 'arr' array.

  if (( n % 2 == 1 )); then  # Checks if the number of elements in the 'arr' array is odd.
    echo "${sorted_arr[mid]}"  # If the number of elements is odd, print the middle element of the 'arr' array as the median.
  else
    # If the number of elements is even, calculate the median by taking the average of the two middle elements using 'bc' (a command-line calculator).
    echo "scale=3; (${sorted_arr[mid-1]} + ${sorted_arr[mid]}) / 2" | bc
  fi
}

# Calculate the median from the times_array and print the result
median=$(calculate_median "${times_array[@]}")
echo "Median Time: $median"
