// calc.cc
#include <napi.h>
//#include <node.h>
#include <exception>
#include <map>

#if defined _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace calc {

Napi::Value EmptyCallback(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    return env.Undefined();
}

void copyNapiArrayToVector(std::vector<std::string>& dest, const Napi::Array& arr)
{
    int length = arr.Length();

    for (int i = 0; i < length; i++)
    {
        std::string value = arr[i].ToString();
        dest.push_back(value);
    }
}

void copyVectorToNapiArray(Napi::Env env, Napi::Array& arr, std::vector<std::string>& src)
{
    int length = src.size();

    for (int i = 0; i < length; i++)
    {
        std::string value = src[i];
        arr.Set(i, value);
    }
}

static std::map<std::string, std::vector<std::string> > FILES = {};
static std::map<std::string, std::map<std::string, int> > BLOCKS = {};
static std::map<std::string, int> BLOCK_WEIGHTS = {};
static std::vector<std::string> BLOCK_KEYS = {};

Napi::Value setInput(const Napi::CallbackInfo& info)
{
    const Napi::Object INPUT = info[0].As<Napi::Object>();
    Napi::Object files = INPUT["FILES"].ToObject();
    Napi::Object blocks = INPUT["BLOCKS"].As<Napi::Object>();
    const Napi::Array blockKeys = INPUT["BLOCK_KEYS"].As<Napi::Array>();

    // FILES processing
    FILES = {};
    const Napi::Array fileIds = files.GetPropertyNames();

    for (int i = 0; i < (int)fileIds.Length(); i++)
    {
        std::string fileId = fileIds[i].ToString();
        std::vector<std::string> fileBlocks = {};
        FILES[fileId] = fileBlocks;

        const Napi::Object fileItem = files.Get(fileId).As<Napi::Object>();
        const Napi::Array fileBlocksArray = fileItem["fileBlocks"].As<Napi::Array>();

        copyNapiArrayToVector(fileBlocks, fileBlocksArray);
    }

    // BLOCKS processing
    BLOCKS = {};
    const Napi::Array blockIds = blocks.GetPropertyNames();

    for (int i = 0; i < (int)blockIds.Length(); i++)
    {
        std::string blockId = blockIds[i].ToString();
        const Napi::Object blockItem = blocks.Get(blockId).As<Napi::Object>();

        int blockWeight = blockItem["blockWeight"].ToNumber().Int32Value();
        BLOCK_WEIGHTS[blockId] = blockWeight;

        Napi::Object filesInBlockObject = blockItem["files"].As<Napi::Object>();
        std::map<std::string, int> filesInBlock = {};

        const Napi::Array fileIdsInBlock = filesInBlockObject.GetPropertyNames();

        for (int j = 0; j < (int) fileIdsInBlock.Length(); j++)
        {
            std::string fileId = fileIdsInBlock[j].ToString();
            filesInBlock[fileId] = 1;
        }

        BLOCKS[blockId] = filesInBlock;
    }

//      Test
//    for (int i = 0; i < 3; i++)
//    {
//        std::string blockId = blockIds[i].ToString();
//
//        std::map<std::string, int> filesInBlock = BLOCKS[blockId];
//
//        for(std::map<std::string, int>::iterator it = filesInBlock.begin(); it != filesInBlock.end(); it++)
//        {
//            std::string key = it->first;
////            int value = it->second;
//            //Do something
//            printf("Block %s, fileId %s\n", blockId.c_str(), key.c_str());
//        }
//    }

    BLOCK_KEYS = {};
    copyNapiArrayToVector(BLOCK_KEYS, blockKeys);

    return info.Env().Undefined();
}

class CalcWorker : public Napi::AsyncWorker {

private:
    Napi::Promise::Deferred deferred;
    const Napi::CallbackInfo& info;

    std::vector<std::string> blocks = {};

    // Result variables
    int weight = 0;
    std::vector<std::string> files = {};
    std::vector<std::string> blocksToRemove = {};

public:
    CalcWorker(Napi::Function& callback, Napi::Promise::Deferred deferred, const Napi::CallbackInfo& cInfo)
    : Napi::AsyncWorker(callback), deferred(deferred), info(cInfo) {

//        printf("Inside CalcWorker constructor\n");

        const Napi::Array blocksParam = info[0].As<Napi::Array>();
        copyNapiArrayToVector(blocks, blocksParam);
    }
    ~CalcWorker() {}

    void Execute () {

        try {

            printf("Inside CalcWorker Execute\n");

//            Sleep(1000);
//
//        Napi::Object filesMap = Napi::Object::New(env);
          std::map<std::string, int> filesMap = {};

        for (int i = 0; i < blocks.size(); i++)
        {
//            Napi::Number blockIndex = blocks.Get(i).ToNumber();
            std::string blockIndex = blocks[i];
//            printf("blockIndex = %d\n", blockIndex.c_str());

//            const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();
//            const Napi::Array filesForBlock = inputBlocksAtIndex["filesKeys"].As<Napi::Array>();

            std::map<std::string, int> filesForBlock = BLOCKS[blockIndex];

            for(std::map<std::string, int>::iterator it = filesForBlock.begin(); it != filesForBlock.end(); it++)
            {
                std::string fileIndex = it->first;
                filesMap[fileIndex] = 1;
            }

//            for (int j = 0; j < (int)filesForBlock.Length(); j++)
//            {
//                Napi::String fileIndex = filesForBlock[j].As<Napi::String>();
//                filesMap[fileIndex] = Napi::Boolean::New(env, true);
//            }
        }


//        Napi::Object blocksInFiles = Napi::Object::New(env);
        std::map<std::string, int> blocksInFiles = {};

//        const Napi::Array files = filesMap.GetPropertyNames();

        for(std::map<std::string, int>::iterator it = filesMap.begin(); it != filesMap.end(); it++)
        {
            std::string fileIndex = it->first;
            files.push_back(fileIndex);
        }

//    printf("filesLength = %d\n", files.size());

        for (int i = 0; i < files.size(); i++)
        {
//            const Napi::String file = files[i].ToString();
            std::string file = files[i];
//            const Napi::Object fileObject = INPUT_FILES[file].ToObject();
//            const Napi::Array fileBlocks = fileObject["fileBlocks"].As<Napi::Array>();

            std::vector<std::string> fileBlocks = FILES[file];
//        printf("fileBlocksLength = %d\n", fileBlocks.size());

            for (int j = 0; j < fileBlocks.size(); j++)
            {
                // This operation is slow
//                const Napi::Object block = fileBlocks[j].ToObject();
//                const Napi::String blockIndex = block["blockIndex"].ToString();
                std::string blockIndex = fileBlocks[j];

                if (blocksInFiles.find(blockIndex) == blocksInFiles.end())
                {
                    blocksInFiles[blockIndex] = 1;
                }
                else
                {
                    blocksInFiles[blockIndex] = blocksInFiles[blockIndex] + 1;
                }

//                if (blocksInFiles.Has(blockIndex) == false)
//                {
//                    Napi::Object blockObject = Napi::Object::New(env);
//                    blockObject[blockIndex] = blockIndex;
//                    blockObject["count"] = 1;
//                    blocksInFiles[blockIndex] = blockObject;
//                }
//                else
//                {
//                    Napi::Object blockObject = blocksInFiles.Get(blockIndex).As<Napi::Object>();
//                    blockObject["count"] = blockObject.Get("count").As<Napi::Number>().Int32Value () + 1;
//                }
            }
        }

//        const Napi::Array blocksInFilesKeys = blocksInFiles.GetPropertyNames();

        std::map<std::string, int> blocksToRemoveMap = {};

//        for (int i = 0; i < (int)blocksInFilesKeys.Length(); i++)
        for(std::map<std::string, int>::iterator it = blocksInFiles.begin(); it != blocksInFiles.end(); it++)
        {
//            const Napi::String blockIndex = blocksInFilesKeys[i].ToString();

            std::string blockIndex = it->first;

//            const Napi::Object block = blocksInFiles.Get(blockIndex).As<Napi::Object>();
//            const int blockCount = block["count"].ToNumber().Int32Value();
            int blockCount = it->second;

//            const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();

            std::map<std::string, int> inputBlocksAtIndex = BLOCKS[blockIndex];

//            int filesBlockCount = inputBlocksAtIndex["filesKeys"].As<Napi::Array>().Length();

            int filesBlockCount = inputBlocksAtIndex.size();

            if (blockCount == filesBlockCount)
            {
                int blockWeight = BLOCK_WEIGHTS[blockIndex];
                weight += blockWeight;
                blocksToRemoveMap[blockIndex] = 1;
            }
        }

        for(std::map<std::string, int>::iterator it = blocksToRemoveMap.begin(); it != blocksToRemoveMap.end(); it++)
        {
            std::string key = it->first;
            blocksToRemove.push_back(key);
        }


        }
        catch (std::exception e)
        {
            printf("Error On Execute: %s\n", e.what());
            SetError(e.what());
        }

        printf("Inside CalcWorker Execute with Result\n");
    }

    void OnError() {

        Napi::HandleScope scope(Env());
        deferred.Reject(Napi::Error::New(Env(), "Something wrong").Value());

        // Call empty function
        Callback().Call({});
    }


    void OnOK()
    {
        Napi::Env env = Env();

        Napi::Object Result = Napi::Object::New(env);

        Napi::Array filesForResult = Napi::Array::New(env);
        copyVectorToNapiArray(env, filesForResult, files);
        Result["files"] = filesForResult;

        Napi::Array blocksForResult = Napi::Array::New(env);
        copyVectorToNapiArray(env, blocksForResult, blocksToRemove);
        Result["blocks"] = blocksForResult;

        Result["weight"] = Napi::Number::New(env, weight);

        deferred.Resolve(Result);

        // Call empty function
        Callback().Call({});
    }
};

Napi::Object getFileInfoForBlocks(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(info.Env());
    Napi::Function callback = Napi::Function::New(env, EmptyCallback);

    CalcWorker* worker = new CalcWorker(callback, deferred, info);
    worker->Queue();

    return deferred.Promise();
}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    Napi::HandleScope scope(env);

    exports.Set("getFileInfoForBlocks", Napi::Function::New(env, getFileInfoForBlocks));
    exports.Set("setInput", Napi::Function::New(env, setInput));

    return exports;
}

NODE_API_MODULE(calc, Init)

}  // namespace calc
