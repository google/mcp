# `google/mcp`

This repository contains a list of Google's official Model Context Protocol (MCP) servers, guidance on how to deploy MCP servers to Google Cloud, and examples to get started.

## ⚡ Google MCP Servers

### **Remote MCP servers** 

These [remote MCP servers are managed by Google](https://docs.cloud.google.com/mcp/overview), and are available [via endpoint](https://docs.cloud.google.com/mcp/enable-disable-mcp-servers). This list will be kept up-to-date as more remote servers become available. 

* [**Google Maps (Grounding Lite)**](https://developers.google.com/maps/ai/grounding-lite)  
* [**BigQuery**](https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp)  
* [**Kubernetes Engine (GKE)**](https://docs.cloud.google.com/kubernetes-engine/docs/reference/mcp)   
* [**Compute Engine (GCE)**](https://docs.cloud.google.com/compute/docs/reference/mcp)
* [**Google Security Operations (Chronicle)**](https://docs.cloud.google.com/chronicle/docs/reference/mcp)
* [**Developer Knowledge API (Google Developer Documentation)**](https://developers.google.com/knowledge/mcp)
* [**Cloud Resource Manager(https://docs.cloud.google.com/resource-manager/reference/mcp)**](https://docs.cloud.google.com/resource-manager/reference/mcp)

### **Open-source MCP servers**  

You can run these open-source MCP servers locally, or deploy them to Google Cloud (see below).  

* [**Google Workspace**](https://github.com/gemini-cli-extensions/workspace), including Google Docs, Sheets, Slides, Calendar, and Gmail. (Gemini CLI extension)  
* [**Firebase**](https://github.com/gemini-cli-extensions/firebase/) (Gemini CLI extension)  
* [**Cloud Run**](https://github.com/GoogleCloudPlatform/cloud-run-mcp) (Gemini CLI Extension)
* [**Go**](https://go.dev/gopls/features/mcp) 
* [**Google Analytics**](https://github.com/googleanalytics/google-analytics-mcp)  
* [**MCP Toolbox for Databases**](https://github.com/googleapis/genai-toolbox), including BigQuery, Cloud SQL, AlloyDB, Spanner, Firestore, and more.  
* [**Google Cloud Storage**](https://github.com/googleapis/gcloud-mcp/tree/main/packages/storage-mcp)  
* [**Genmedia**](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia), including Imagen and Veo models.  
* [**Kubernetes Engine (GKE)**](https://github.com/GoogleCloudPlatform/gke-mcp)  
* [**Google Cloud Security**](https://github.com/google/mcp-security), including Security Command Center, Chronicle, and more.  
* [**gcloud CLI**](https://github.com/googleapis/gcloud-mcp/tree/main/packages/gcloud-mcp)  
* [**Google Cloud Observability**](https://github.com/googleapis/gcloud-mcp/tree/main/packages/observability-mcp)
* [**Flutter/Dart**](https://github.com/dart-lang/ai/tree/main/pkgs/dart_mcp_server)
* [**Google Maps Platform Code Assist toolkit**](https://developers.google.com/maps/ai/mcp)
* [**Chrome DevTools**](https://github.com/ChromeDevTools/chrome-devtools-mcp)

## 💻 Examples

* [**Launch My Bakery**](http://github.com/google/mcp/tree/main/examples/launchmybakery) (`/examples/launchmybakery`)**:** A sample agent built with Agent Development Kit (ADK) that uses remote MCP servers for Google Maps and BigQuery. 


## 📙 Resources

### **Run an MCP server in Google Cloud** 

* [Documentation \- Host MCP Servers on Cloud Run](https://docs.cloud.google.com/run/docs/host-mcp-servers)  
* Blog Post \- [Build and Deploy a Remote MCP Server to Google Cloud Run in Under 10 Minutes](https://cloud.google.com/blog/topics/developers-practitioners/build-and-deploy-a-remote-mcp-server-to-google-cloud-run-in-under-10-minutes)  
* [MCP Toolbox for Databases \- Deploy to Cloud Run](https://googleapis.github.io/genai-toolbox/how-to/deploy_toolbox/), [Deploy to Google Kubernetes Engine (GKE)](https://googleapis.github.io/genai-toolbox/how-to/deploy_gke/)  
* [Blog post - Announcing MCP support for Apigee](https://cloud.google.com/blog/products/ai-machine-learning/mcp-support-for-apigee) (Turnkey MCP hosting for Apigee-hosted APIs)  
* “Tools Make an Agent” \- [Blog](https://cloud.google.com/blog/topics/developers-practitioners/tools-make-an-agent-from-zero-to-assistant-with-adk) and [Codelab](https://codelabs.developers.google.com/codelabs/cloud-run/tools-make-an-agent)  
* Codelab \- [How to deploy a secure MCP server on Cloud Run](https://codelabs.developers.google.com/codelabs/cloud-run/how-to-deploy-a-secure-mcp-server-on-cloud-run#0)  
* [Codelab \- "Agent Verse" \- Architecting Multi-agent Systems](http://goo.gle/summoner) 

## 🤝 Contributing

We welcome contributions to this repository, including bug reports, feature requests, documentation improvements, and code contributions. Please see our [Contributing Guidelines](https://github.com/google/mcp/blob/main/CONTRIBUTING.md) to get started.

## 📃 License

This project is licensed under the Apache 2.0 License \- see the [LICENSE](https://github.com/google/mcp/blob/main/LICENSE) file for details.

## Disclaimers

This is not an officially supported Google product. This project is intended for demonstration purposes only.

This project is not eligible for the [Google Open Source Software Vulnerability Rewards Program](https://bughunters.google.com/open-source-security).  
