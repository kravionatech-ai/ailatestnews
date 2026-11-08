<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | AI Latest News</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #090d16;
            color: #e2e8f0;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
          }
          .header {
            background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            padding: 24px 28px;
            margin-bottom: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 26px;
            color: #ffffff;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          p.desc {
            margin: 0 0 16px 0;
            color: #94a3b8;
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            background: rgba(99, 102, 241, 0.15);
            color: #818cf8;
            border: 1px solid rgba(99, 102, 241, 0.3);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            overflow: hidden;
          }
          th {
            background: #1e293b;
            color: #cbd5e1;
            text-align: left;
            padding: 12px 16px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          td {
            padding: 12px 16px;
            border-top: 1px solid #1e293b;
            font-size: 13px;
            color: #cbd5e1;
          }
          tr:hover td {
            background: rgba(99, 102, 241, 0.05);
          }
          a {
            color: #60a5fa;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            color: #93c5fd;
            text-decoration: underline;
          }
          .priority {
            display: inline-block;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
          }
          .freq {
            color: #94a3b8;
            font-size: 12px;
            text-transform: capitalize;
          }
          .date {
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>XML Sitemap</h1>
            <p class="desc">
              This XML Sitemap is generated in real-time by AI Latest News to help search engines like Google and Bing discover and index content efficiently.
            </p>
            <span class="badge">
              Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55%;">URL</th>
                <th style="width: 10%;">Priority</th>
                <th style="width: 15%;">Change Freq</th>
                <th style="width: 20%;">Last Modified (UTC)</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td>
                    <span class="priority"><xsl:value-of select="sitemap:priority"/></span>
                  </td>
                  <td>
                    <span class="freq"><xsl:value-of select="sitemap:changefreq"/></span>
                  </td>
                  <td>
                    <span class="date"><xsl:value-of select="sitemap:lastmod"/></span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <div class="footer">
            Generated dynamically by Kraviona AI News System
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
