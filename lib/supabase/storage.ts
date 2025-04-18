import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Blobまたはファイルからデータのバイナリを取得する
 */
async function getBlobData(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Blob URL から実際のBlobオブジェクトを取得する
 */
async function fetchBlobFromUrl(blobUrl: string): Promise<Blob> {
  const response = await fetch(blobUrl);
  return await response.blob();
}

/**
 * 画像をSupabaseのストレージにアップロードする
 * @param imageFile Blob、File、またはBlob URL
 * @param folderPath フォルダパス（オプション）
 * @returns アップロードされた画像の公開URL
 */
export async function uploadImageToStorage(
  imageFile: Blob | File | string,
  folderPath: string = ""
): Promise<string> {
  try {
    const supabase = createClientComponentClient();

    // ユーザー認証情報を取得
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("ユーザーが認証されていません");
    }

    let blob: Blob;

    // 入力がBlobまたはFileオブジェクトかBlobURL文字列かを判断
    if (typeof imageFile === "string" && imageFile.startsWith("blob:")) {
      blob = await fetchBlobFromUrl(imageFile);
    } else if (imageFile instanceof Blob) {
      blob = imageFile;
    } else if (
      typeof imageFile === "object" &&
      "type" in imageFile &&
      "name" in imageFile
    ) {
      // FileオブジェクトはBlobを継承しているので、Blobとして扱える
      blob = imageFile as Blob;
    } else {
      throw new Error("不正な画像形式です");
    }

    // ファイル名を生成（ユニークなもの）
    const fileExt = blob.type.split("/")[1];
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // バイナリデータを取得
    const data = await getBlobData(blob);

    // ストレージにアップロード
    const { data: uploadData, error } = await supabase.storage
      .from("photos") // バケット名
      .upload(filePath, data, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.error("ストレージアップロードエラー:", error);
      throw error;
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    throw error;
  }
}
