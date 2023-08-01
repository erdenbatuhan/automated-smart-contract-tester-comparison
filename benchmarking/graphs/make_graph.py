import json
import math
import numpy as np
import matplotlib.pyplot as plt

# Set font sizes for the entire figure
plt.rcParams.update({
    'font.size': 7,
    'axes.labelsize': 8,
    'axes.titlesize': 9,
    'xtick.labelsize': 7,
    'ytick.labelsize': 7,
    'legend.fontsize': 8.5,
})

POSITIONAL_VALUES = ["center", "left", "right"]


def create_perf_graph(projects, framework_color_palette):
  for metadata in [
      {
        "name": "Test Execution Time", "type": "Seconds", "key_for_value": "execution_time_seconds",
        "box_formatter": lambda y: f"{y:.2f}s", "y_axis_step_size": 1
      },
      {
        "name": "Container Size", "type": "MB", "key_for_value": "container_size_mb",
        "box_formatter": lambda y: f"{y} MB", "y_axis_step_size": 100
      }
  ]:
    for project in projects:
      plt.figure(figsize=(8, 5))
      ax = plt.gca()

      ax.set_title(f"{project['name']} - {metadata['name']}s (Lower is better!)")
      ax.set_xlabel("Docker Container Version")
      ax.set_ylabel(f"{metadata['name']} ({metadata['type']})")

      max_y_value = 0
      for result in project["tests_docker"]:
        x_values, y_values = [], []

        # Annotate
        for x, y in zip(
          [item["id"] for item in result["data"]],
          [item[metadata["key_for_value"]] for item in result["data"]]
        ):
          if y is not None:
            x_values.append(x)
            y_values.append(y)

            ax.annotate(
              metadata["box_formatter"](y), (x, y),
              textcoords="offset points", xytext=(8, 2), ha="left", fontsize=7,
              bbox=dict(boxstyle="round, pad=0.2", facecolor="whitesmoke", edgecolor="black", lw=0.5)
            )

        max_y_value = max(max_y_value, max(y_values))
        framework_color = framework_color_palette[result["framework_name"]]

        ax.plot(
          x_values, y_values,
          label=result["framework_name"], color=framework_color, linestyle = "solid",
          marker = "o", markerfacecolor = framework_color, markeredgecolor = "black", markersize = 6
        )

      # Adjust font size and position of the legend
      ax.legend(fontsize=8.5, loc="upper right", bbox_to_anchor=(0.99, 0.93), facecolor="whitesmoke", edgecolor="black")

      plt.xticks(rotation=0)
      plt.yticks([i for i in range(0, int(max_y_value + 2), metadata["y_axis_step_size"]) if i != 0], rotation=0)
      plt.tight_layout()

      for line in ax.lines:
        line.set_linewidth(0.5)
        line.set_antialiased(True)

      # Save the plot to a file
      filename = f"{project['name'].replace(' ', '')}_{metadata['name'].replace(' ', '')}"
      plt.savefig(f"out/{filename}.png", dpi=500)
      plt.close()


def create_hardware_graph(projects, framework_color_palette):
  plt.figure(figsize=(10, 4))
  ax = plt.gca()

  last_project = projects[-1]  # Get the last project as it's probably the biggest

  ax.set_title(f"{last_project['name']} - Test Execution Times with Different Number of CPUs (Lower is better!)")
  ax.set_xlabel("Number of CPUs")
  ax.set_ylabel("Test Execution Time (Seconds)")

  x_values = last_project["tests_hardware"]["cpus"]
  all_y_values = []

  for idx, result in enumerate(last_project["tests_hardware"]["results"]):
    y_values = result["data"]
    all_y_values += y_values
    framework_color = framework_color_palette[result["framework_name"]]

    # Determine the sign (positive or negative) based on the index of the project
    sign = 1 if idx % 2 == 0 else -1

    # Annotate
    for x, y in zip(x_values, y_values):
      ax.annotate(
        f"{y:.2f}s", (x, y),
        textcoords="offset points", xytext=(sign * 6, sign * 2), ha="left" if sign == 1 else "center", fontsize=5,
        bbox=dict(boxstyle="round, pad=0.2", facecolor="whitesmoke", edgecolor="black", lw=0.5),
        rotation=40
      )

    ax.plot(
      x_values, y_values, label=result["framework_name"], color=framework_color, linestyle="solid",
      marker="o", markerfacecolor=framework_color, markeredgecolor="black", markersize=8
    )

  # Adjust font size and position of the legend
  ax.legend(fontsize=8.5, loc="upper right", bbox_to_anchor=(0.99, 0.93), facecolor="whitesmoke", edgecolor="black")

  plt.xticks(x_values, rotation=90)
  plt.yticks([i for i in range(0, int(max(all_y_values)) + 1, 5) if i != 0], rotation=0)
  plt.tight_layout()

  for line in ax.lines:
    line.set_linewidth(0.5)
    line.set_antialiased(True)

  # Save the plot to a file
  filename = f"{last_project['name'].replace(' ', '')}_HardwareTests"
  plt.savefig(f"out/{filename}.png", dpi=500)
  plt.close()


def create_local_run_graph(projects, framework_color_palette):
  plt.figure(figsize=(7, 3))
  ax = plt.gca()

  ax.set_title(f"Compilation and Testing Times of Different Frameworks")
  ax.set_xlabel("Smart Contract Project")
  ax.set_ylabel("Compilation and Testing Time (Seconds)")

  project_names = [project["name"] for project in projects]
  data, max_result = {}, 0

  for project in projects:
      for test_data in project["tests_local"]:
        framework_name = test_data["framework_name"]
        result = test_data["result"]

        data[framework_name] = data.get(framework_name, []) + [result]
        max_result = max(max_result, result)

  for framework_name, values in data.items():
    framework_color = framework_color_palette[framework_name]

    # Annotate
    for i in range(len(values)):
      sign = 1 if i % 2 == 0 else -1
      annotation_text = f"{values[i]:.2f}s"

      if i > 0:
        slowdown = ((values[i] - values[i - 1]) / values[i - 1]) * 100
        annotation_text = f"{annotation_text} ({slowdown:.2f}% slower)"

      ax.annotate(
        annotation_text, (project_names[i], values[i]),
        textcoords="offset points", xytext=(8 * sign, 4 * sign), ha=POSITIONAL_VALUES[sign],
        bbox=dict(boxstyle="round, pad=0.2", facecolor="whitesmoke", edgecolor="black", lw=0.5)
      )

    ax.plot(
      project_names, values, label=framework_name, color=framework_color, linestyle="solid",
      marker="o", markerfacecolor=framework_color, markeredgecolor="black", markersize=5
    )

  # Adjust font size and position of the legend
  ax.legend(loc="upper right", bbox_to_anchor=(1, 1), facecolor="whitesmoke", edgecolor="black")

  plt.xticks(project_names, rotation=0)
  plt.yticks([i for i in range(0, math.ceil(max_result * 1.5), 1) if i != 0], rotation=0)
  plt.tight_layout()

  for line in ax.lines:
    line.set_linewidth(0.5)

  # Save the plot to a file
  plt.savefig(f"out/LocalCompilationTestingTimes.png", dpi=500)
  plt.close()


if __name__ == "__main__":
  with open("./data/results.json", "r") as file:
    data = json.load(file)

  framework_color_palette = {framework["name"]: framework["color"] for framework in data["frameworks"]}

  # create_perf_graph(data["projects"], framework_color_palette)
  # create_hardware_graph(data["projects"], framework_color_palette)
  create_local_run_graph(data["projects"], framework_color_palette)
