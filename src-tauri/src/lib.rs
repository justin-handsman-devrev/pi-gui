mod commands;
mod rpc_bridge;
mod types;

use rpc_bridge::PiBridgeState;
use types::BridgeState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
