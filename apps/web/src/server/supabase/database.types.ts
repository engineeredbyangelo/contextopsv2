
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_type": Database["public"]['Enums']["actor_type"],"created_at": string,"id": string,"metadata": NonNullable<Json>,"subject_id": string | null,"subject_type": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_type": Database["public"]['Enums']["actor_type"],"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"subject_id"?: string | null,"subject_type": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_type"?: Database["public"]['Enums']["actor_type"],"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"subject_id"?: string | null,"subject_type"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"github_installations": {
                  Row: {
                    "account_login": string,"account_type": Database["public"]['Enums']["github_account_type"],"created_at": string,"id": string,"installation_id": number,"repo_selection": Database["public"]['Enums']["repo_selection"],"suspended_at": string | null,"uninstalled_at": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_login": string,"account_type": Database["public"]['Enums']["github_account_type"],"created_at"?: string,"id"?: string,"installation_id": number,"repo_selection": Database["public"]['Enums']["repo_selection"],"suspended_at"?: string | null,"uninstalled_at"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "account_login"?: string,"account_type"?: Database["public"]['Enums']["github_account_type"],"created_at"?: string,"id"?: string,"installation_id"?: number,"repo_selection"?: Database["public"]['Enums']["repo_selection"],"suspended_at"?: string | null,"uninstalled_at"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "github_installations_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["workspace_role"],"token_hash": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["workspace_role"],"token_hash": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["workspace_role"],"token_hash"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"policies": {
                  Row: {
                    "created_at": string,"created_by": string | null,"current_version_id": string | null,"description": string | null,"draft": Json | null,"id": string,"name": string,"slug": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"current_version_id"?: string | null,"description"?: string | null,"draft"?: Json | null,"id"?: string,"name": string,"slug": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"current_version_id"?: string | null,"description"?: string | null,"draft"?: Json | null,"id"?: string,"name"?: string,"slug"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "policies_current_version_id_fkey"
      columns: ["current_version_id"]
isOneToOne: false
      referencedRelation: "policy_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "policies_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"policy_assignments": {
                  Row: {
                    "created_at": string,"id": string,"pinned_version_id": string | null,"policy_id": string,"repository_id": string,"targets": (string)[],"track_latest": boolean,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"pinned_version_id"?: string | null,"policy_id": string,"repository_id": string,"targets"?: (string)[],"track_latest"?: boolean,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"pinned_version_id"?: string | null,"policy_id"?: string,"repository_id"?: string,"targets"?: (string)[],"track_latest"?: boolean,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "policy_assignments_pinned_version_id_fkey"
      columns: ["pinned_version_id"]
isOneToOne: false
      referencedRelation: "policy_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "policy_assignments_policy_id_fkey"
      columns: ["policy_id"]
isOneToOne: false
      referencedRelation: "policies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "policy_assignments_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: true
      referencedRelation: "repositories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "policy_assignments_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: true
      referencedRelation: "repository_status"
      referencedColumns: ["repository_id"]
    },{
      foreignKeyName: "policy_assignments_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"policy_versions": {
                  Row: {
                    "changelog": string,"content": NonNullable<Json>,"content_hash": string,"created_at": string,"id": string,"policy_id": string,"published_at": string,"published_by": string | null,"semver": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changelog": string,"content": NonNullable<Json>,"content_hash": string,"created_at"?: string,"id"?: string,"policy_id": string,"published_at"?: string,"published_by"?: string | null,"semver": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "changelog"?: string,"content"?: NonNullable<Json>,"content_hash"?: string,"created_at"?: string,"id"?: string,"policy_id"?: string,"published_at"?: string,"published_by"?: string | null,"semver"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "policy_versions_policy_id_fkey"
      columns: ["policy_id"]
isOneToOne: false
      referencedRelation: "policies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "policy_versions_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"github_login": string | null,"name": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"github_login"?: string | null,"name"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"github_login"?: string | null,"name"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"repo_exemptions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"expires_at": string | null,"id": string,"reason": string,"repository_id": string,"revoked_at": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"reason": string,"repository_id": string,"revoked_at"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"reason"?: string,"repository_id"?: string,"revoked_at"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "repo_exemptions_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repositories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "repo_exemptions_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repository_status"
      referencedColumns: ["repository_id"]
    },{
      foreignKeyName: "repo_exemptions_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"repo_file_states": {
                  Row: {
                    "applied_version_id": string | null,"blob_sha": string | null,"checked_at": string | null,"created_at": string,"drift_diff": string | null,"expected_hash": string | null,"id": string,"managed_hash": string | null,"path": string,"repository_id": string,"target": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_version_id"?: string | null,"blob_sha"?: string | null,"checked_at"?: string | null,"created_at"?: string,"drift_diff"?: string | null,"expected_hash"?: string | null,"id"?: string,"managed_hash"?: string | null,"path": string,"repository_id": string,"target": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "applied_version_id"?: string | null,"blob_sha"?: string | null,"checked_at"?: string | null,"created_at"?: string,"drift_diff"?: string | null,"expected_hash"?: string | null,"id"?: string,"managed_hash"?: string | null,"path"?: string,"repository_id"?: string,"target"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "repo_file_states_applied_version_id_fkey"
      columns: ["applied_version_id"]
isOneToOne: false
      referencedRelation: "policy_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "repo_file_states_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repositories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "repo_file_states_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repository_status"
      referencedColumns: ["repository_id"]
    },{
      foreignKeyName: "repo_file_states_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"repositories": {
                  Row: {
                    "archived": boolean,"created_at": string,"default_branch": string,"disconnected_at": string | null,"full_name": string,"github_repo_id": number,"id": string,"installation_id": string,"last_scanned_at": string | null,"name": string,"owner_login": string,"primary_language": string | null,"updated_at": string,"variables": NonNullable<Json>,"visibility": Database["public"]['Enums']["repo_visibility"],"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"default_branch"?: string,"disconnected_at"?: string | null,"full_name": string,"github_repo_id": number,"id"?: string,"installation_id": string,"last_scanned_at"?: string | null,"name": string,"owner_login": string,"primary_language"?: string | null,"updated_at"?: string,"variables"?: NonNullable<Json>,"visibility": Database["public"]['Enums']["repo_visibility"],"workspace_id": string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"default_branch"?: string,"disconnected_at"?: string | null,"full_name"?: string,"github_repo_id"?: number,"id"?: string,"installation_id"?: string,"last_scanned_at"?: string | null,"name"?: string,"owner_login"?: string,"primary_language"?: string | null,"updated_at"?: string,"variables"?: NonNullable<Json>,"visibility"?: Database["public"]['Enums']["repo_visibility"],"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "repositories_installation_id_fkey"
      columns: ["installation_id"]
isOneToOne: false
      referencedRelation: "github_installations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "repositories_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"rollout_items": {
                  Row: {
                    "branch": string | null,"created_at": string,"error_code": string | null,"error_message": string | null,"id": string,"pr_number": number | null,"pr_url": string | null,"repository_id": string,"rollout_id": string,"status": Database["public"]['Enums']["rollout_item_status"],"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "branch"?: string | null,"created_at"?: string,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"pr_number"?: number | null,"pr_url"?: string | null,"repository_id": string,"rollout_id": string,"status"?: Database["public"]['Enums']["rollout_item_status"],"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "branch"?: string | null,"created_at"?: string,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"pr_number"?: number | null,"pr_url"?: string | null,"repository_id"?: string,"rollout_id"?: string,"status"?: Database["public"]['Enums']["rollout_item_status"],"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rollout_items_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repositories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rollout_items_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repository_status"
      referencedColumns: ["repository_id"]
    },{
      foreignKeyName: "rollout_items_rollout_id_fkey"
      columns: ["rollout_id"]
isOneToOne: false
      referencedRelation: "rollouts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rollout_items_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"rollouts": {
                  Row: {
                    "created_at": string,"created_by": string | null,"finished_at": string | null,"id": string,"policy_version_id": string,"started_at": string | null,"status": Database["public"]['Enums']["rollout_status"],"targets": (string)[],"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"finished_at"?: string | null,"id"?: string,"policy_version_id": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["rollout_status"],"targets": (string)[],"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"finished_at"?: string | null,"id"?: string,"policy_version_id"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["rollout_status"],"targets"?: (string)[],"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rollouts_policy_version_id_fkey"
      columns: ["policy_version_id"]
isOneToOne: false
      referencedRelation: "policy_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rollouts_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"sync_pull_requests": {
                  Row: {
                    "closed_at": string | null,"created_at": string,"head_sha": string | null,"id": string,"merged_at": string | null,"opened_at": string,"pr_number": number,"pr_url": string,"repository_id": string,"rollout_item_id": string | null,"state": Database["public"]['Enums']["pull_request_state"],"title": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closed_at"?: string | null,"created_at"?: string,"head_sha"?: string | null,"id"?: string,"merged_at"?: string | null,"opened_at"?: string,"pr_number": number,"pr_url": string,"repository_id": string,"rollout_item_id"?: string | null,"state"?: Database["public"]['Enums']["pull_request_state"],"title": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "closed_at"?: string | null,"created_at"?: string,"head_sha"?: string | null,"id"?: string,"merged_at"?: string | null,"opened_at"?: string,"pr_number"?: number,"pr_url"?: string,"repository_id"?: string,"rollout_item_id"?: string | null,"state"?: Database["public"]['Enums']["pull_request_state"],"title"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sync_pull_requests_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repositories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sync_pull_requests_repository_id_fkey"
      columns: ["repository_id"]
isOneToOne: false
      referencedRelation: "repository_status"
      referencedColumns: ["repository_id"]
    },{
      foreignKeyName: "sync_pull_requests_rollout_item_id_fkey"
      columns: ["rollout_item_id"]
isOneToOne: false
      referencedRelation: "rollout_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sync_pull_requests_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspace_members": {
                  Row: {
                    "created_at": string,"id": string,"role": Database["public"]['Enums']["workspace_role"],"updated_at": string,"user_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["workspace_role"],"updated_at"?: string,"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["workspace_role"],"updated_at"?: string,"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_members_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"plan": Database["public"]['Enums']["workspace_plan"],"settings": NonNullable<Json>,"slug": string,"stripe_customer_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"plan"?: Database["public"]['Enums']["workspace_plan"],"settings"?: NonNullable<Json>,"slug": string,"stripe_customer_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"plan"?: Database["public"]['Enums']["workspace_plan"],"settings"?: NonNullable<Json>,"slug"?: string,"stripe_customer_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "repository_status": {
                  Row: {
                    "applied_version_id": string | null,"checked_at": string | null,"error_code": string | null,"error_message": string | null,"exemption_expires_at": string | null,"exemption_reason": string | null,"expected_version_id": string | null,"open_pr_number": number | null,"open_pr_url": string | null,"policy_id": string | null,"repository_id": string,"status": Database["public"]['Enums']["repository_compliance"] | null,"targets": (string)[] | null,"track_latest": boolean | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "policy_assignments_policy_id_fkey"
      columns: ["policy_id"]
isOneToOne: false
      referencedRelation: "policies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "repositories_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "create_workspace":
{ Args: { "p_name": string,"p_settings"?: Json,"p_slug": string }; Returns: {
              "created_at": string,
"id": string,
"name": string,
"plan": Database["public"]['Enums']["workspace_plan"],
"settings": NonNullable<Json>,
"slug": string,
"stripe_customer_id": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "workspaces"
        isOneToOne: true
        isSetofReturn: false
      } },
"has_workspace_role":
{ Args: { "min_role": Database["public"]['Enums']["workspace_role"],"ws": string }; Returns: boolean
                           },
"is_workspace_member":
{ Args: { "ws": string }; Returns: boolean
                           },
"log_audit_event":
{ Args: { "p_action": string,"p_metadata"?: Json,"p_subject_id"?: string,"p_subject_type": string,"p_workspace_id": string }; Returns: string
                           }
          }
          Enums: {
            "actor_type": "user"|"system"|"github","github_account_type": "organization"|"user","pull_request_state": "open"|"merged"|"closed","repo_selection": "all"|"selected","repo_visibility": "public"|"private"|"internal","repository_compliance": "compliant"|"drifted"|"pending_sync"|"sync_failed"|"exempted"|"disconnected"|"unassigned","rollout_item_status": "queued"|"running"|"pr_open"|"up_to_date"|"merged"|"closed"|"failed"|"skipped","rollout_status": "queued"|"running"|"completed"|"completed_with_errors"|"failed"|"cancelled","workspace_plan": "free"|"team"|"agency"|"enterprise","workspace_role": "viewer"|"editor"|"admin"|"owner"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "actor_type": ["user", "system", "github"],"github_account_type": ["organization", "user"],"pull_request_state": ["open", "merged", "closed"],"repo_selection": ["all", "selected"],"repo_visibility": ["public", "private", "internal"],"repository_compliance": ["compliant", "drifted", "pending_sync", "sync_failed", "exempted", "disconnected", "unassigned"],"rollout_item_status": ["queued", "running", "pr_open", "up_to_date", "merged", "closed", "failed", "skipped"],"rollout_status": ["queued", "running", "completed", "completed_with_errors", "failed", "cancelled"],"workspace_plan": ["free", "team", "agency", "enterprise"],"workspace_role": ["viewer", "editor", "admin", "owner"]
          }
        }
} as const
