// calc.cc
#include <napi.h>
//#include <node.h>


namespace calc {

Napi::Object getFileInfoForBlocks(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    const Napi::Array blocks = info[0].As<Napi::Array>();
//    printf("blocks length = %d\n", blocks.Length());

    const Napi::Object INPUT = info[1].As<Napi::Object>();
    const Napi::Object INPUT_BLOCKS = INPUT["BLOCKS"].ToObject();
    const Napi::Object INPUT_FILES = INPUT["FILES"].ToObject();

    Napi::Object filesMap = Napi::Object::New(env);
    int weight = 0;

    for (int i = 0; i < (int)blocks.Length(); i++)
    {
        Napi::Number blockIndex = blocks[i].ToNumber();
//        printf("blockIndex = %d\n", blockIndex.Int32Value());

        const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();
        const Napi::Array filesForBlock = inputBlocksAtIndex["filesKeys"].As<Napi::Array>();

        for (int j = 0; j < (int)filesForBlock.Length(); j++)
        {
            Napi::String fileIndex = filesForBlock[j].As<Napi::String>();
            filesMap[fileIndex] = Napi::Boolean::New(env, true);
        }
    }


    const Napi::Array files = filesMap.GetPropertyNames();
    Napi::Object blocksInFiles = Napi::Object::New(env);
    int filesLength = (int)files.Length();
//    printf("filesLength = %d\n", filesLength);

    for (int i = 0; i < filesLength; i++)
    {
        const Napi::String file = files[i].ToString();
        const Napi::Object fileObject = INPUT_FILES[file].ToObject();
        const Napi::Array fileBlocks = fileObject["fileBlocks"].As<Napi::Array>();

        int fileBlocksLength = (int)fileBlocks.Length();
//        printf("fileBlocksLength = %d\n", fileBlocksLength);
        for (int j = 0; j < fileBlocksLength; j++)
        {
            // This operation is slow
            const Napi::Object block = fileBlocks[j].ToObject();
            const Napi::String blockIndex = block["blockIndex"].ToString();

            if (blocksInFiles.Has(blockIndex) == false)
            {
                Napi::Object blockObject = Napi::Object::New(env);
                blockObject[blockIndex] = blockIndex;
                blockObject["count"] = 1;
                blocksInFiles[blockIndex] = blockObject;
            }
            else
            {
                Napi::Object blockObject = blocksInFiles.Get(blockIndex).As<Napi::Object>();
                blockObject["count"] = blockObject.Get("count").As<Napi::Number>().Int32Value () + 1;
            }
        }
    }

    const Napi::Array blocksInFilesKeys = blocksInFiles.GetPropertyNames();

    for (int i = 0; i < (int)blocksInFilesKeys.Length(); i++)
    {
        const Napi::String blockIndex = blocksInFilesKeys[i].ToString();
        const Napi::Object block = blocksInFiles.Get(blockIndex).As<Napi::Object>();
        const int blockCount = block["count"].ToNumber().Int32Value();
        const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();
        int filesBlockCount = inputBlocksAtIndex["filesKeys"].As<Napi::Array>().Length();

        if (blockCount == filesBlockCount)
        {
            weight = inputBlocksAtIndex["blockWeight"].ToNumber().Int32Value() + weight;
        }
    }

    Napi::Object result = Napi::Object::New(env);
    result["files"] = files;
    result["blocks"] = blocksInFilesKeys;
    result["weight"] = weight;

    return result;
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "getFileInfoForBlocks"),
              Napi::Function::New(env, getFileInfoForBlocks));
    return exports;
}

NODE_API_MODULE(calc, Init)

}  // namespace calc
