def extract_local_test_results(projects):
  local_test_results = {}

  for project in projects:
    for test_data in project["tests_local"]:
      framework_name, result = test_data["framework_name"], test_data["result"]

      if framework_name not in local_test_results:
        local_test_results[framework_name] = { "framework_name": framework_name, "project_names": [], "values": [] }

      local_test_results[framework_name]["project_names"].append(project["name"])
      local_test_results[framework_name]["values"].append(result)

  return [{
    "name": " ".join([project["name"] for project in projects]),
    "tests_local": list(local_test_results.values())
  }]
