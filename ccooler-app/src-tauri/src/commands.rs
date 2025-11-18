use serde::{Deserialize, Serialize};
use sysinfo::Disks;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    pub used: f64,
    pub total: f64,
    pub available: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CleanItem {
    pub id: u32,
    pub name: String,
    pub size: f64,
    pub paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CleanResult {
    pub success: bool,
    pub cleaned_size: f64,
    pub cleaned_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Software {
    pub name: String,
    pub path: String,
    pub size: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeChatInfo {
    pub installed: bool,
    pub install_path: String,
    pub data_path: String,
    pub chat_size: f64,
    pub file_size: f64,
    pub media_size: f64,
    pub other_size: f64,
}

#[tauri::command]
pub fn get_disk_info() -> Result<DiskInfo, String> {
    let disks = Disks::new_with_refreshed_list();
    
    // 查找C盘
    for disk in &disks {
        let name = disk.name().to_string_lossy();
        if name.starts_with("C:") || disk.mount_point().to_string_lossy().starts_with("C:") {
            let total = disk.total_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            let available = disk.available_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            let used = total - available;
            
            return Ok(DiskInfo {
                used,
                total,
                available,
            });
        }
    }
    
    Err("C盘未找到".to_string())
}

#[tauri::command]
pub fn scan_clean_items() -> Result<Vec<CleanItem>, String> {
    // TODO: 实现真实的扫描逻辑
    // 目前返回模拟数据
    Ok(vec![
        CleanItem {
            id: 1,
            name: "系统临时文件".to_string(),
            size: 2.3,
            paths: vec!["%TEMP%".to_string(), "C:\\Windows\\Temp".to_string()],
        },
        CleanItem {
            id: 2,
            name: "浏览器缓存".to_string(),
            size: 1.8,
            paths: vec!["Chrome".to_string(), "Edge".to_string(), "Firefox".to_string()],
        },
        CleanItem {
            id: 3,
            name: "回收站".to_string(),
            size: 3.5,
            paths: vec!["RecycleBin".to_string()],
        },
        CleanItem {
            id: 4,
            name: "Windows更新缓存".to_string(),
            size: 4.2,
            paths: vec!["SoftwareDistribution".to_string()],
        },
        CleanItem {
            id: 5,
            name: "系统文件清理".to_string(),
            size: 5.8,
            paths: vec!["WER".to_string(), "Prefetch".to_string()],
        },
        CleanItem {
            id: 6,
            name: "下载目录".to_string(),
            size: 3.2,
            paths: vec!["Downloads".to_string()],
        },
        CleanItem {
            id: 7,
            name: "应用缓存".to_string(),
            size: 0.7,
            paths: vec!["AppData\\Local\\Temp".to_string()],
        },
    ])
}

#[tauri::command]
pub fn clean_files(item_ids: Vec<u32>) -> Result<CleanResult, String> {
    // TODO: 实现真实的清理逻辑
    // 目前返回模拟结果
    println!("Cleaning items: {:?}", item_ids);
    
    Ok(CleanResult {
        success: true,
        cleaned_size: 12.5,
        cleaned_count: 2189,
    })
}

#[tauri::command]
pub fn get_installed_software() -> Result<Vec<Software>, String> {
    // TODO: 从注册表读取已安装软件
    // 目前返回模拟数据
    Ok(vec![
        Software {
            name: "Microsoft Office".to_string(),
            path: "C:\\Program Files\\Microsoft Office".to_string(),
            size: 2.3,
        },
        Software {
            name: "Google Chrome".to_string(),
            path: "C:\\Program Files\\Google\\Chrome".to_string(),
            size: 1.2,
        },
        Software {
            name: "WeChat".to_string(),
            path: "C:\\Program Files\\Tencent\\WeChat".to_string(),
            size: 0.856,
        },
    ])
}

#[tauri::command]
pub fn get_wechat_info() -> Result<WeChatInfo, String> {
    // TODO: 检测微信安装和数据目录
    // 目前返回模拟数据
    Ok(WeChatInfo {
        installed: true,
        install_path: "C:\\Program Files\\Tencent\\WeChat".to_string(),
        data_path: "C:\\Users\\用户名\\Documents\\WeChat Files".to_string(),
        chat_size: 8.5,
        file_size: 3.2,
        media_size: 2.8,
        other_size: 1.3,
    })
}

#[tauri::command]
pub fn open_wechat() -> Result<(), String> {
    // TODO: 启动微信程序
    println!("Opening WeChat...");
    Ok(())
}
