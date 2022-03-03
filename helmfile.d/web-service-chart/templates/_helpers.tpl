{{- define "app.name" -}}
  {{ required ".Values.appName is required!" .Values.appName }}
{{- end -}}

{{- define "app.version" -}}
  {{ required ".Values.appVersion is required!" .Values.appVersion }}
{{- end -}}

{{- define "app.fullImageTag" -}}
  {{ required ".Values.deployment.appDockerRepo is required!" .Values.deployment.appDockerRepo }}:{{ include "app.version" . }}
{{- end -}}

{{- define "app.resources" }}
resources:
  requests:
{{ toYaml (required ".Values.deployment.resources.requests is required!" .Values.deployment.resources.requests) | indent 4 }}
  limits:
{{ toYaml (required ".Values.deployment.resources.limits is required!" .Values.deployment.resources.limits) | indent 4 }}
{{- end}}

{{- define "app.labels" -}}
app: {{ include "app.name" . }}
app-version: {{ include "app.version" . | quote }}
{{- if .Values.deployment.branch }}
branch: {{ .Values.deployment.branch }}
{{- end}}
chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
release: {{ .Release.Name }}
heritage: {{ .Release.Service }}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/version: {{ include "app.version" . | quote }}
app.kubernetes.io/managed-by: helm
app.kubernetes.io/part-of: {{ required ".Values.appSystemName is required!" .Values.appSystemName}}
{{- end }}
