import json
import matplotlib.pyplot as plt

from data.metadata import GRAPH_METADATA
from data.data_loader import extract_local_test_results


# Set font sizes for the entire figure
plt.rcParams.update({
    'figure.titlesize': 'xx-large',
    'axes.labelsize': 8,
    'axes.titlesize': 9,
    'xtick.labelsize': 7,
    'ytick.labelsize': 7,
    'legend.fontsize': 8.5,
    'font.size': 7,
    'lines.linewidth': 1.0  # Previously 0.5
})


def create_graph(graph_metadata, projects, frameworks):
  for metadata in graph_metadata:
    if metadata["only_last_project"]:
      fig, ax = plt.subplots(1, 1, figsize=metadata["fig_size"])
      axes, project_data = [ax], [projects[-1]]
    else:
      fig, axes = plt.subplots(1, len(projects), figsize=metadata["fig_size"])
      project_data = projects

    fig.suptitle(metadata["title"])
    max_y_value = 0

    # Break out of the look if the project does not have this type of data
    if project_data[0][f"tests_{metadata['test_type']}"] is None:
      continue

    for project_idx, project in enumerate(project_data):
      ax = axes[project_idx]

      ax.set_title(project["name"])
      ax.set_xlabel(metadata["xlabel"])
      ax.set_ylabel(metadata["ylabel"])

      # Iterate over data
      for data_idx, result in enumerate(project[f"tests_{metadata['test_type']}"]):
        data_sign = 1 if data_idx % 2 == 0 else -1
        x_values, y_values = [], []

        # Annotate
        for zip_idx, (x, y) in enumerate(zip(metadata["get_x_values"](result), metadata["get_y_values"](result))):
          datapoint_sign = 1 if zip_idx % 2 == 0 else -1

          if y is not None:
            x_values.append(x)
            y_values.append(y)
            max_y_value = max(max_y_value, y)

            # Create the annotation text
            annotation_text = metadata["annotation"]["get_box_format"](y)
            if metadata["annotation"]["slowdown_included"] and zip_idx > 0:
              slowdown = ((y - y_values[zip_idx - 1]) / y_values[zip_idx - 1]) * 100
              annotation_text = f"{annotation_text} ({slowdown:.2f}% slower)"

            # Add the annotation
            ax.annotate(
              text=annotation_text, xy=(x, y),
              fontsize=metadata["annotation"]["fontsize"], rotation=metadata["annotation"]["rotation"],
              textcoords="offset points", ha=metadata["annotation"]["get_ha"]((data_sign, datapoint_sign)),
              xytext=metadata["annotation"]["get_xy_text"]((data_sign, datapoint_sign)),
              bbox=dict(boxstyle="round, pad=0.2", facecolor="whitesmoke", edgecolor="black", lw=0.5)
            )

        # Plot the line
        framework_info = frameworks[result["framework_name"]]
        ax.plot(x_values, y_values, **{
          "label": result["framework_name"], "color": framework_info["color"], "linestyle": framework_info["linestyle"],
          "markerfacecolor": framework_info["color"], "marker": "o", "markeredgecolor": "black", "markersize": metadata["markersize"]
        })

        # Rotate the x-ticks
        if isinstance(x_values[0], (int, float)):  # For numeric x-tick labels
          ax.set_xticks(ticks=x_values)
          ax.set_xticklabels(x_values, rotation=metadata["xticks_rotation"])
        else:  # For non-numeric x-tick labels
          plt.xticks(rotation=metadata["xticks_rotation"])

      # Adjust font size and position of the legend
      ax.legend(loc="upper right", facecolor="whitesmoke", edgecolor="black")

    # Update y-ticks
    for ax in axes:
      yticks = metadata["get_yticks"](max_y_value)
      ax.set_yticks(ticks=yticks, labels=yticks, rotation=metadata["yticks_rotation"])

    # Save the plot to a file
    plt.tight_layout()
    plt.savefig(f"out/{metadata['id']}.png", dpi=500)
    plt.close()


if __name__ == "__main__":
  with open("./data/results.json", "r") as file:
    data = json.load(file)
    frameworks = {framework["name"]: framework for framework in data["frameworks"]}

  # Create the graphs (Test Execution Times, Container Sizes and Hardware Tests)
  create_graph(graph_metadata=GRAPH_METADATA[:-1], projects=data["projects"], frameworks=frameworks)

  # Create another graph for the local test results (Local Compilation Testing Times)
  create_graph(graph_metadata=GRAPH_METADATA[-1:], projects=extract_local_test_results(data["projects"]), frameworks=frameworks)
