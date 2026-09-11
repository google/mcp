  "google/mcp"

This repository contains a list of Google's official Model Context Protocol (MCP) servers, guidance on how to deploy MCP servers to Google Cloud, and examples to help you get started.

Author: Dechaphon Arthet

⚡ Google MCP Servers

Remote MCP servers

These "remote MCP servers are managed by Google" (https://docs.cloud.google.com/mcp/overview) and are available "via endpoints" (https://docs.cloud.google.com/mcp/enable-disable-mcp-servers).

Below are a few key remote MCP servers. For a comprehensive list of all remote MCP servers managed by Google that are generally available (GA) or in public preview, "visit the supported products page" (https://docs.cloud.google.com/mcp/supported-products).

- "AlloyDB for PostgreSQL" (https://docs.cloud.google.com/alloydb/docs/ai/use-alloydb-mcp)
- "BigQuery" (https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp)
- "Bigtable" (https://docs.cloud.google.com/bigtable/docs/use-bigtable-mcp)
- "Cloud Resource Manager" (https://docs.cloud.google.com/resource-manager/reference/mcp)
- "Cloud SQL for MySQL" (https://docs.cloud.google.com/sql/docs/mysql/use-cloudsql-mcp)
- "Cloud SQL for PostgreSQL" (https://docs.cloud.google.com/sql/docs/postgres/use-cloudsql-mcp)
- "Cloud SQL for SQL Server" (https://docs.cloud.google.com/sql/docs/sqlserver/use-cloudsql-mcp)
- "Compute Engine (GCE)" (https://docs.cloud.google.com/compute/docs/reference/mcp)
- "Developer Knowledge API (Google Developer Documentation)" (https://developers.google.com/knowledge/mcp)
- "Firestore" (https://docs.cloud.google.com/firestore/native/docs/use-firestore-mcp)
- "Google Maps (Grounding Lite)" (https://developers.google.com/maps/ai/grounding-lite)
- "Google Security Operations (Chronicle)" (https://docs.cloud.google.com/chronicle/docs/reference/mcp)
- "Kubernetes Engine (GKE)" (https://docs.cloud.google.com/kubernetes-engine/docs/reference/mcp)
- "Spanner" (https://docs.cloud.google.com/spanner/docs/use-spanner-mcp)
- "Cloud Run" (https://docs.cloud.google.com/run/docs/reference/mcp) (GA)
- "Cloud Storage" (https://docs.cloud.google.com/storage/docs/reference/mcp)

Open-source MCP servers

You can run these open-source MCP servers locally or deploy them to Google Cloud.

- Google Workspace, including Google Docs, Sheets, Slides, Calendar, and Gmail.
- Firebase
- Cloud Run
- Go
- Google Analytics
- MCP Toolbox for Databases
- Google Cloud Storage
- Genmedia
- Kubernetes Engine (GKE)
- Google Cloud Security
- gcloud CLI
- Google Cloud Observability
- Flutter/Dart
- Angular
- Google Maps Platform Code Assist toolkit
- Chrome DevTools

💻 Examples

- Launch My Bakery — A sample agent built with the Agent Development Kit (ADK) that uses remote MCP servers for Google Maps and BigQuery.
- Allstrides — A sample app migrated from local to Cloud using remote MCP servers for Developer Knowledge, Cloud SQL, and Cloud Run.

📙 Resources

Run an MCP server in Google Cloud

- Documentation - Host MCP Servers on Cloud Run
- Blog Post - Build and Deploy a Remote MCP Server to Google Cloud Run in Under 10 Minutes
- MCP Toolbox for Databases - Deploy to Cloud Run / GKE
- Blog Post - Announcing MCP support for Apigee
- "Tools Make an Agent" - Blog and Codelab
- Codelab - "Agent Verse" - Architecting Multi-agent Systems
- Codelab - How to deploy a secure MCP server on Cloud Run

🤝 Contributing

We welcome contributions to this repository, including bug reports, feature requests, documentation improvements, and code contributions.

📃 License

This project is licensed under the Apache License 2.0.

Disclaimers

This is not an officially supported Google product. This project is intended for demonstration purposes only.

This project is not eligible for the Google Open Source Software Vulnerability Rewards Program.

Author: Dechaphon Arthet
