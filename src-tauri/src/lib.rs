use tauri::command;
use mac_address::get_mac_address;
use sha2::{Sha256, Digest};

#[command]
fn get_machine_id() -> Result<String, String> {
    match get_mac_address() {
        Ok(Some(mac)) => {
            let mut hasher = Sha256::new();
            hasher.update(mac.to_string().as_bytes());
            let hash = hasher.finalize();
            Ok(format!("{:x}", hash))
        }
        _ => Err("Impossible de récupérer l'adresse MAC".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![get_machine_id])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
