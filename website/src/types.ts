export interface FeatureLink {
  title: string;
  body: string;
  url: string;
  icon?: string;
  label?: string;
  image?: string;
  image_alt?: string;
  image_width?: number;
  image_height?: number;
  media_label?: string;
}

export interface IndexData {
  title: string;
  description: string;
  h1: string;
  lead: string;
  section?: string;
  items: FeatureLink[];
}

export interface ArticleData {
  title: string;
  description: string;
  section?: string;
  parent_url?: string;
  parent_label?: string;
  h1: string;
  lead: string;
  updated: string;
  updatedIso: string;
  icon?: string;
  image?: string;
  image_alt?: string;
  image_caption?: string;
  related?: FeatureLink[];
}

export interface ArticlePageData extends ArticleData {
  bodyHtml: string;
}
