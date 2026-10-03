"""Render the CLI's one-pager Markdown as a saved, downloadable PDF.

Run with uv run --with reportlab python scripts/render_one_pager.py INPUT OUTPUT.
"""

import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def inline(text: str) -> str:
    text = escape(text.replace("—", "-").replace("•", "|"))
    text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
    return re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)


def render(source: Path, output: Path) -> None:
    font_root = Path("/usr/share/fonts/truetype/dejavu")
    pdfmetrics.registerFont(TTFont("Demo", str(font_root / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DemoBold", str(font_root / "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFontFamily("Demo", normal="Demo", bold="DemoBold", italic="Demo")
    green = colors.HexColor("#1B4332")
    styles = {
        "title": ParagraphStyle(
            "title",
            fontName="DemoBold",
            fontSize=15,
            leading=19,
            textColor=green,
            spaceAfter=8,
        ),
        "heading": ParagraphStyle(
            "heading",
            fontName="DemoBold",
            fontSize=9,
            leading=12,
            textColor=green,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "body", fontName="Demo", fontSize=8, leading=11, spaceAfter=3
        ),
        "cell": ParagraphStyle("cell", fontName="Demo", fontSize=7.2, leading=9.5),
    }
    content = []
    lines = source.read_text().splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-: ]+", c) for c in cells):
                    rows.append([Paragraph(inline(c), styles["cell"]) for c in cells])
                i += 1
            widths = [175, 348] if len(rows[0]) == 2 else [282, 70, 72, 99]
            table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1EC")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LINEBELOW", (0, 0), (-1, 0), 0.5, green),
                        (
                            "LINEBELOW",
                            (0, 1),
                            (-1, -1),
                            0.25,
                            colors.HexColor("#DDE4DF"),
                        ),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            content.append(table)
            continue
        if line.startswith("# "):
            content.append(Paragraph(inline(line[2:]), styles["title"]))
        elif line.startswith("## "):
            content.append(Paragraph(inline(line[3:]), styles["heading"]))
        elif line == "---":
            content.append(Spacer(1, 4))
        elif line:
            content.append(Paragraph(inline(line), styles["body"]))
        i += 1
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=28,
        bottomMargin=28,
        title="Optiver Executive Summary",
        author="AdaHack 2026 team",
    )

    def footer(canvas, document):
        canvas.setFont("Demo", 7)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(
            36,
            15,
            "Saved demo run | 3 October 2026 | Synthetic prices and assumed risks",
        )
        canvas.drawRightString(A4[0] - 36, 15, str(document.page))

    doc.build(content, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    render(Path(sys.argv[1]), Path(sys.argv[2]))
