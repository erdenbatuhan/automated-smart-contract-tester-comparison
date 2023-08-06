POSITIONAL_VALUES = ["center", "left", "right"]

GRAPH_METADATA = [
  {
    "id": "TestExecutionTimes",
    "title": "Test Execution Times",
    "fig_size": (15, 5),
    "xlabel": "Docker Container Version",
    "ylabel": "Test Execution Time (Seconds)",
    "test_type": "docker",
    "only_last_project": False,
    "get_x_values": lambda result: [item["id"] for item in result["data"] if not item.get("disabled", False)],
    "get_y_values": lambda result: [item["execution_time_seconds"] for item in result["data"] if not item.get("disabled", False)],
    "markersize": 6,
    "annotation": {
      "fontsize": 7,
      "rotation": 0,
      "get_box_format": lambda y: f"{y:.2f}s",
      "get_ha": lambda _: POSITIONAL_VALUES[1],
      "get_xy_text": lambda _: (8, 2),
      "slowdown_included": False
    },
    "get_yticks": lambda max_y_value: [i for i in range(0, int(max_y_value + 2), 1) if i != 0],
    "xticks_rotation": 0,
    "yticks_rotation": 0
  },
  {
    "id": "ContainerSizes",
    "title": "Container Sizes",
    "fig_size": (7, 5),
    "xlabel": "Docker Container Version",
    "ylabel": "Container Size (MB)",
    "test_type": "docker", "only_last_project": True,
    "get_x_values": lambda result: [item["id"] for item in result["data"] if not item.get("disabled", False)],
    "get_y_values": lambda result: [item["container_size_mb"] for item in result["data"] if not item.get("disabled", False)],
    "markersize": 6,
    "annotation": {
      "fontsize": 7,
      "rotation": 0,
      "get_box_format": lambda y: f"{y} MB",
      "get_ha": lambda _: POSITIONAL_VALUES[1],
      "get_xy_text": lambda _: (8, 2),
      "slowdown_included": False
    },
    "get_yticks": lambda max_y_value: [i for i in range(0, int(max_y_value * 1.3 + 200), 100) if i != 0],
    "xticks_rotation": 0,
    "yticks_rotation": 0
  },
  {
    "id": "HardwareTests",
    "title": "Test Execution Times with Different Number of CPUs",
    "fig_size": (10, 4),
    "xlabel": "Number of CPUs",
    "ylabel": "Test Execution Time (Seconds)",
    "test_type": "hardware",
    "only_last_project": True,
    "get_x_values": lambda result: result["cpus"],
    "get_y_values": lambda result: result["values"],
    "markersize": 8,
    "annotation": {
      "fontsize": 5,
      "rotation": 40,
      "get_box_format": lambda y: f"{y:.2f}s",
      "get_ha": lambda signs: POSITIONAL_VALUES[signs[0]] if signs[0] >= 1 else POSITIONAL_VALUES[0],
      "get_xy_text": lambda signs: (signs[0] * 6, signs[0] * 2),
      "slowdown_included": False
    },
    "get_yticks": lambda max_y_value: [i for i in range(0, int(max_y_value + 10), 5) if i != 0],
    "xticks_rotation": 90,
    "yticks_rotation": 0
  },
  {
    "id": "LocalCompilationTestingTimes",
    "title": "Compilation and Testing Times of Different Frameworks",
    "fig_size": (8, 4),
    "xlabel": "Smart Contract Project",
    "ylabel": "Compilation and Testing Time (Seconds)",
    "test_type": "local",
    "only_last_project": True,
    "get_x_values": lambda result: result["project_names"],
    "get_y_values": lambda result: result["values"],
    "markersize": 5,
    "annotation": {
      "fontsize": 7,
      "rotation": 0,
      "get_box_format": lambda y: f"{y:.2f}s",
      "get_ha": lambda signs: POSITIONAL_VALUES[signs[1]],
      "get_xy_text": lambda signs: (signs[1] * 8, signs[1] * 4),
      "slowdown_included": True
    },
    "get_yticks": lambda max_y_value: [i for i in range(0, int(max_y_value * 1.3 + 2), 1) if i != 0],
    "xticks_rotation": 0,
    "yticks_rotation": 0
  }
]
