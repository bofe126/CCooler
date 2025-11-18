mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
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
    .invoke_handler(tauri::generate_handler![
      commands::get_disk_info,
      commands::scan_clean_items,
      commands::clean_files,
      commands::get_installed_software,
      commands::get_wechat_info,
      commands::open_wechat,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
