use anyhow::Result;
use std::path::Path;
use tracing::info;

/// Parse document to markdown text
pub fn parse_document(path: &str) -> Result<String> {
    let ext = Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    info!("Parsing document: {} (type: {})", path, ext);

    match ext.as_str() {
        "txt" => parse_txt(path),
        "md" => parse_md(path),
        "docx" => parse_docx(path),
        "pdf" => parse_pdf(path),
        "epub" => parse_epub(path),
        "fb2" => parse_fb2(path),
        _ => anyhow::bail!("Unsupported file format: {}", ext),
    }
}

fn parse_txt(path: &str) -> Result<String> {
    std::fs::read_to_string(path).map_err(Into::into)
}

fn parse_md(path: &str) -> Result<String> {
    std::fs::read_to_string(path).map_err(Into::into)
}

fn parse_docx(path: &str) -> Result<String> {
    // TODO: Use docx-rs crate
    // let doc = docx_rs::read_file(path)?;
    // Ok(doc.document.to_string())
    std::fs::read_to_string(path).map_err(Into::into)
}

fn parse_pdf(path: &str) -> Result<String> {
    // TODO: Use pdf-extract crate
    // let text = pdf_extract::extract_text(path)?;
    // Ok(text)
    std::fs::read_to_string(path).map_err(Into::into)
}

fn parse_epub(path: &str) -> Result<String> {
    // TODO: Use epub crate
    // let doc = epub::Doc::new(path)?;
    // Ok(doc.get_metadata("title").unwrap_or_default())
    std::fs::read_to_string(path).map_err(Into::into)
}

fn parse_fb2(path: &str) -> Result<String> {
    // FB2 is XML-based, parse with quick-xml or similar
    // TODO: Implement FB2 parsing
    std::fs::read_to_string(path).map_err(Into::into)
}