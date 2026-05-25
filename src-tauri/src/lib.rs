mod commands;
mod cron;
mod file_ops;
mod git_ops;
mod rpc_bridge;
mod session_paths;
mod skills;
mod types;

use rpc_bridge::PiBridgeState;
use types::BridgeState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage::<PiBridgeState>(tokio::sync::Mutex::new(BridgeState { bridge: None }))
        .invoke_handler(tauri::generate_handler![
            commands::start_agent,
            commands::send_prompt,
            commands::steer,
            commands::abort_agent,
            commands::new_session,
            commands::get_state,
            commands::set_model,
            commands::get_available_models,
            commands::set_thinking_level,
            commands::compact_session,
            commands::switch_session,
            commands::get_messages,
            commands::get_session_stats,
            commands::resolve_session_path,
            commands::list_directory,
            commands::read_text_file,
            commands::write_text_file,
            commands::list_scheduled_jobs,
            commands::upsert_scheduled_job,
            commands::delete_scheduled_job,
            commands::set_scheduled_job_enabled,
            commands::git_status,
            commands::git_diff,
            commands::git_stage,
            commands::git_unstage,
            commands::git_discard,
            commands::git_commit,
            commands::git_log,
            commands::list_installed_skills,
            commands::set_skill_enabled,
            commands::read_skill_content,
            commands::write_skill_content,
            commands::skills_cli_add,
            commands::skills_cli_list,
            commands::skills_cli_list_remote,
            commands::skills_cli_find,
            commands::skills_cli_remove,
            commands::skills_cli_update,
            commands::skills_cli_init,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
